/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * La solicitud de un estudiante a una convocatoria (EPIC-03).
 *
 * Su ciclo de vida lo gobiernan los objetos de `domain/estados/` (patrón State). Esta clase no
 * tiene ni un `if (estado === ...)`: pregunta a su estado actual qué sigue, aplica la respuesta y
 * deja constancia en el historial.
 *
 * TRAZABILIDAD
 *   Toda transición queda en `historial` con fecha, autor y motivo. Es la respuesta directa a uno
 *   de los problemas del enunciado —"poca trazabilidad del proceso"— y la base de US-016. El
 *   historial solo crece: no hay método para quitar ni modificar una entrada.
 *
 * LOS DOCUMENTOS EXIGIDOS SE COPIAN AL CREAR LA SOLICITUD
 *   Se toma una foto de lo que exigía la convocatoria en ese momento. Una convocatoria publicada
 *   ya no puede cambiar sus requisitos (US-007, criterio 3), pero si algún día se permitiera, las
 *   solicitudes ya iniciadas no deben quedar incompletas de un día para otro.
 */
import { randomUUID } from 'node:crypto';

import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Decision, NombreEstado } from '../enums/solicitud.enums';
import { EstadoBorrador, EstadoSolicitud, estadoDesde } from '../estados/estados-solicitud';
import { ArchivoDocumento } from '../value-objects/archivo-documento.vo';

/** Un documento ya almacenado. Se identifica por el tipo de documento que satisface. */
export interface DocumentoCargado {
  readonly tipo: string;
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
  readonly tamanoBytes: number;
  /** Dónde lo guardó el adaptador de almacenamiento. Opaco para el dominio. */
  readonly referencia: string;
  readonly cargadoEn: Date;
}

export interface EntradaHistorial {
  readonly id: string;
  readonly desde: NombreEstado | null;
  readonly hacia: NombreEstado;
  readonly autorId: string;
  readonly motivo: string | null;
  readonly ocurridoEn: Date;
}

/**
 * US-024. La constancia del otorgamiento. Vive DENTRO de la solicitud (composición `0..1` del
 * diagrama de clases) para que el cambio a ADJUDICADA y la beca se guarden en la misma transacción:
 * no puede haber una solicitud adjudicada sin beca, ni una beca de una solicitud que no lo está.
 */
export interface BecaOtorgada {
  readonly codigo: string;
  readonly otorgadaEn: Date;
}

export interface AtributosSolicitud {
  readonly id: string;
  readonly numero: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly estado: NombreEstado;
  readonly documentosExigidos: readonly string[];
  readonly documentos: readonly DocumentoCargado[];
  readonly historial: readonly EntradaHistorial[];
  readonly enviadaEn: Date | null;
  readonly creadaEn: Date;
  readonly beca?: BecaOtorgada | null;
}

export class Solicitud {
  private estado: EstadoSolicitud;
  private readonly documentos: Map<string, DocumentoCargado>;
  private readonly historial: EntradaHistorial[];
  private _enviadaEn: Date | null;
  private _beca: BecaOtorgada | null;

  private constructor(private readonly atributos: AtributosSolicitud) {
    this.estado = estadoDesde(atributos.estado);
    this.documentos = new Map(atributos.documentos.map((d) => [d.tipo, d]));
    this.historial = [...atributos.historial];
    this._enviadaEn = atributos.enviadaEn;
    this._beca = atributos.beca ?? null;
  }

  /** US-012, criterio 3: nace en BORRADOR, con su primera entrada de historial. */
  static nueva(datos: {
    id: string;
    numero: string;
    estudianteId: string;
    convocatoriaId: string;
    documentosExigidos: readonly string[];
    ahora: Date;
  }): Solicitud {
    return new Solicitud({
      ...datos,
      estado: NombreEstado.BORRADOR,
      documentosExigidos: [...new Set(datos.documentosExigidos)],
      documentos: [],
      historial: [
        {
          id: randomUUID(),
          desde: null,
          hacia: NombreEstado.BORRADOR,
          autorId: datos.estudianteId,
          motivo: null,
          ocurridoEn: datos.ahora,
        },
      ],
      enviadaEn: null,
      creadaEn: datos.ahora,
    });
  }

  static reconstituir(atributos: AtributosSolicitud): Solicitud {
    return new Solicitud(atributos);
  }

  get id(): string {
    return this.atributos.id;
  }
  get numero(): string {
    return this.atributos.numero;
  }
  get estudianteId(): string {
    return this.atributos.estudianteId;
  }
  get convocatoriaId(): string {
    return this.atributos.convocatoriaId;
  }
  get creadaEn(): Date {
    return this.atributos.creadaEn;
  }
  get enviadaEn(): Date | null {
    return this._enviadaEn;
  }
  get nombreEstado(): NombreEstado {
    return this.estado.nombre;
  }
  get beca(): BecaOtorgada | null {
    return this._beca;
  }
  /** Fecha del último cambio de estado (US-025). */
  get ultimoCambio(): Date {
    return this.historial[this.historial.length - 1]?.ocurridoEn ?? this.atributos.creadaEn;
  }
  get documentosExigidos(): readonly string[] {
    return this.atributos.documentosExigidos;
  }

  listaDocumentos(): readonly DocumentoCargado[] {
    return [...this.documentos.values()];
  }

  documento(tipo: string): DocumentoCargado | null {
    return this.documentos.get(tipo) ?? null;
  }

  listaHistorial(): readonly EntradaHistorial[] {
    return [...this.historial];
  }

  perteneceA(usuarioId: string): boolean {
    return this.atributos.estudianteId === usuarioId;
  }

  /** US-012, criterio 2: "activa" es todo lo que no fue rechazado. */
  estaActiva(): boolean {
    return this.estado.estaActiva();
  }

  esEditable(): boolean {
    return this.estado instanceof EstadoBorrador;
  }

  /** US-012, criterio 4 y US-014, criterio 2. */
  documentosFaltantes(): string[] {
    return this.atributos.documentosExigidos.filter((tipo) => !this.documentos.has(tipo));
  }

  /**
   * US-013. Agrega el documento o reemplaza el que había para ese tipo (criterio 3).
   *
   * Devuelve el documento reemplazado, si había, para que el caso de uso borre su archivo DESPUÉS
   * de guardar: si se borrara antes y el guardado fallara, el expediente apuntaría a un archivo
   * que ya no existe.
   */
  cargarDocumento(tipo: string, archivo: ArchivoDocumento, referencia: string, ahora: Date) {
    this.estado.verificarCargaDeDocumentos();

    // Criterio 4: cada documento queda asociado a lo que satisface, y solo a lo que se exige.
    if (!this.atributos.documentosExigidos.includes(tipo)) {
      throw new ReglaDeNegocioError('La convocatoria no exige ese documento.');
    }

    const anterior = this.documentos.get(tipo) ?? null;
    this.documentos.set(tipo, {
      tipo,
      nombreArchivo: archivo.nombreOriginal,
      tipoContenido: archivo.tipoContenido,
      tamanoBytes: archivo.tamanoBytes,
      referencia,
      cargadoEn: ahora,
    });
    return { reemplazado: anterior };
  }

  /** US-014, criterio 3: pasa a ENVIADA, registra fecha y hora, y deja de ser editable. */
  enviar(ahora: Date, autorId: string): void {
    this.transicionar(this.estado.enviar(this), ahora, autorId, null);
    this._enviadaEn = ahora;
  }

  iniciarEvaluacion(ahora: Date, autorId: string): void {
    this.transicionar(this.estado.iniciarEvaluacion(), ahora, autorId, null);
  }

  resolver(decision: Decision, ahora: Date, autorId: string, motivo: string): void {
    if (motivo.trim() === '') {
      throw new ReglaDeNegocioError('Toda resolución debe llevar su motivo.');
    }
    this.transicionar(this.estado.resolver(decision), ahora, autorId, motivo.trim());
  }

  /** US-024. El código de la beca lo asigna el caso de uso (correlativo). */
  adjudicar(ahora: Date, autorId: string, codigoBeca: string): void {
    this.transicionar(this.estado.adjudicar(), ahora, autorId, null);
    this._beca = { codigo: codigoBeca, otorgadaEn: ahora };
  }

  private transicionar(
    siguiente: EstadoSolicitud,
    ahora: Date,
    autorId: string,
    motivo: string | null,
  ): void {
    this.historial.push({
      id: randomUUID(),
      desde: this.estado.nombre,
      hacia: siguiente.nombre,
      autorId,
      motivo,
      ocurridoEn: ahora,
    });
    this.estado = siguiente;
  }
}
