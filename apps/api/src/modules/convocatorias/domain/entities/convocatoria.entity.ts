/**
 * Entidad de negocio de la convocatoria: identidad propia, estado privado y los métodos que
 * expresan sus reglas. Se protege a sí misma: no expone setters que la dejen inválida.
 *
 * No importa NestJS, Prisma ni HTTP y se prueba con TypeScript a secas. Es la regla de
 * docs/05-arquitectura.md §2.3, que además verifica el linter. Cuando cambien las reglas de las
 * becas el cambio entra aquí y en application/, sin tocar controladores ni base de datos.
 *
 * Una convocatoria nueva se crea con `ConvocatoriaFactory` (domain/factories/) y no con
 * `nuevaEnBorrador` directamente: cada tipo de beca trae sus requisitos, documentos y reglas de
 * cupos, y la fábrica concreta los conoce (docs/06-patrones.md §1).
 */
import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { MONTO_SEGUNDA_APROBACION } from '../../../../shared/reglas/montos';
import { EstadoConvocatoria } from '../enums/estado-convocatoria.enum';
import { Requisito } from '../enums/requisito.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
import { TipoDocumento } from '../enums/tipo-documento.enum';
import { PeriodoPostulacion } from '../value-objects/periodo-postulacion.vo';

/** Datos necesarios para reconstruir una convocatoria ya existente. */
export interface AtributosConvocatoria {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly tipo: TipoBeca;
  readonly estado: EstadoConvocatoria;
  readonly cupos: number;
  /** Monto de la beca en quetzales enteros (PO, 17 Oct 2026). */
  readonly montoBeca: number;
  readonly periodo: PeriodoPostulacion;
  readonly requisitos: readonly Requisito[];
  readonly documentosExigidos: readonly TipoDocumento[];
}

export class Convocatoria {
  private constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly titulo: string,
    public readonly descripcion: string,
    public readonly tipo: TipoBeca,
    private _estado: EstadoConvocatoria,
    public readonly cupos: number,
    public readonly montoBeca: number,
    public readonly periodo: PeriodoPostulacion,
    public readonly requisitos: readonly Requisito[],
    public readonly documentosExigidos: readonly TipoDocumento[],
  ) {}

  /**
   * Reconstituye una convocatoria que YA existe (viene de la base de datos).
   *
   * Aun reconstituyendo, se validan las invariantes: si la base de datos tiene un dato
   * corrupto queremos enterarnos aquí y no tres capas más arriba.
   */
  static reconstituir(atributos: AtributosConvocatoria): Convocatoria {
    Convocatoria.validarInvariantes(atributos);

    return new Convocatoria(
      atributos.id,
      atributos.codigo,
      atributos.titulo.trim(),
      atributos.descripcion.trim(),
      atributos.tipo,
      atributos.estado,
      atributos.cupos,
      atributos.montoBeca,
      atributos.periodo,
      // Copias congeladas: quien tenga la entidad no puede hacer `requisitos.push(...)` y
      // cambiarle las reglas a una convocatoria ya publicada por la puerta de atrás.
      Object.freeze(Convocatoria.sinRepetidos(atributos.requisitos)),
      Object.freeze(Convocatoria.sinRepetidos(atributos.documentosExigidos)),
    );
  }

  /**
   * Crea una convocatoria nueva, siempre en `BORRADOR` (US-006, criterio 4). El estado no es un
   * parámetro: para ser visible tiene que pasar por `publicar()` (US-007).
   *
   * Debe llamarlo `ConvocatoriaFactory`. TypeScript no permite restringirlo a la fábrica, así que
   * la regla se hace cumplir en el code review.
   */
  static nuevaEnBorrador(atributos: Omit<AtributosConvocatoria, 'estado'>): Convocatoria {
    return Convocatoria.reconstituir({ ...atributos, estado: EstadoConvocatoria.BORRADOR });
  }

  get estado(): EstadoConvocatoria {
    return this._estado;
  }

  /**
   * Regla central del listado público (US-008): una convocatoria es visible para un visitante
   * solo si está PUBLICADA y su fecha de cierre no ha pasado.
   *
   * Vive en la entidad y no en un `WHERE` ni en el controlador: el repositorio puede filtrar en la
   * base, pero la definición de "visible" es del negocio y se prueba sin base de datos. `ahora`
   * llega por parámetro para que el dominio no dependa del reloj y la regla se pruebe en
   * cualquier fecha.
   */
  esVisiblePublicamente(ahora: Date): boolean {
    return this._estado === EstadoConvocatoria.PUBLICADA && !this.periodo.haVencido(ahora);
  }

  /**
   * PO, 17 Oct 2026: por encima del umbral, cada solicitud de esta convocatoria necesitará dos
   * aprobaciones. Se pregunta aquí para que la regla viva junto al monto y no repartida.
   */
  exigeSegundaAprobacion(): boolean {
    return this.montoBeca > MONTO_SEGUNDA_APROBACION;
  }

  /** ¿Se pueden presentar solicitudes en este momento? Lo usará US-012 en el Sprint 4. */
  admiteSolicitudes(ahora: Date): boolean {
    return this._estado === EstadoConvocatoria.PUBLICADA && this.periodo.contiene(ahora);
  }

  /**
   * US-007, criterio 3: una convocatoria publicada ya no permite editar sus requisitos ni sus
   * cupos. La edición es US-010 y no existe todavía; la regla queda escrita y probada para que,
   * cuando llegue, solo tenga que preguntarle a la entidad.
   */
  admiteEdicion(): boolean {
    return this._estado === EstadoConvocatoria.BORRADOR;
  }

  /**
   * US-007: publicar la convocatoria.
   *
   * Hay dos errores distintos a propósito. Publicar algo que no está en BORRADOR es una
   * transición inválida del ciclo de vida (409): el problema es el estado. Publicar un borrador
   * sin requisitos o sin documentos incumple una regla de negocio (422): el estado es correcto
   * pero el contenido no. Separarlos le dice a la interfaz qué corregir.
   */
  publicar(): void {
    if (this._estado !== EstadoConvocatoria.BORRADOR) {
      throw new TransicionInvalidaError(
        `Solo se puede publicar una convocatoria en BORRADOR; esta está ${this._estado}.`,
      );
    }
    if (this.requisitos.length === 0) {
      throw new ReglaDeNegocioError(
        'No se puede publicar una convocatoria sin al menos un requisito definido.',
      );
    }
    if (this.documentosExigidos.length === 0) {
      throw new ReglaDeNegocioError(
        'No se puede publicar una convocatoria sin al menos un documento exigido.',
      );
    }

    this._estado = EstadoConvocatoria.PUBLICADA;
  }

  private static validarInvariantes(atributos: AtributosConvocatoria): void {
    if (atributos.codigo.trim().length === 0) {
      throw new ReglaDeNegocioError('La convocatoria debe tener un código.');
    }
    if (atributos.titulo.trim().length === 0) {
      throw new ReglaDeNegocioError('La convocatoria debe tener un título.');
    }
    // US-006, criterio 3.
    if (!Number.isInteger(atributos.cupos) || atributos.cupos <= 0) {
      throw new ReglaDeNegocioError('El número de cupos debe ser un entero mayor que cero.');
    }
    // PO, 17 Oct 2026. En quetzales enteros, igual que el ingreso familiar del perfil: el
    // dominio no maneja centavos y una beca no se expresa en fracciones de quetzal.
    //
    // Se admite el 0 al reconstituir, y no es un descuido: las convocatorias creadas antes del
    // 17 de octubre no tienen monto, y la migracion no puede inventarles uno. Un 0 significa
    // "sin monto declarado" y, por tanto, no exige segunda aprobacion. Las nuevas si lo exigen:
    // esa regla vive en la fabrica, que es quien las crea.
    if (!Number.isInteger(atributos.montoBeca) || atributos.montoBeca < 0) {
      throw new ReglaDeNegocioError('El monto de la beca debe ser un entero de quetzales.');
    }
    // US-006, criterio 2 lo garantiza `PeriodoPostulacion.crear`: cierre posterior a apertura.
  }

  private static sinRepetidos<T>(valores: readonly T[]): T[] {
    return [...new Set(valores)];
  }
}
