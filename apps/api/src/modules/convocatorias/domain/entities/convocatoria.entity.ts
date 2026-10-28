/**
 * CAPA: domain/entities/  ·  PLANTILLA DE REFERENCIA DEL PROYECTO
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   La entidad de negocio: identidad propia (un `id` estable), estado interno privado y
 *   los métodos que expresan las reglas del negocio. La entidad se protege a sí misma:
 *   no expone `setters` que permitan dejarla en un estado inválido.
 *
 * QUÉ NO VA AQUÍ
 *   Nada de NestJS, nada de Prisma, nada de HTTP. Este archivo compila y se prueba con
 *   TypeScript a secas. Es la regla que el catedrático revisa en el code review
 *   (docs/05-arquitectura.md §2.3) y que además verifica el linter (eslint.config.mjs).
 *
 * POR QUÉ IMPORTA
 *   Cuando el Ministerio cambie las reglas de las becas —y el enunciado advierte que lo
 *   hará— el cambio entra aquí y en application/. Ni los controladores ni la base de
 *   datos se tocan, y las pruebas del dominio siguen corriendo sin levantar Postgres.
 *
 * ALCANCE
 *   Sprint 1: leer convocatorias y decidir si son visibles al público (US-008).
 *   Sprint 3: requisitos y documentos exigidos (US-006) y la transición a PUBLICADA
 *   (US-007). Cerrar (US-009) y editar un borrador (US-010) quedan para después.
 *
 * CÓMO SE CREA UNA CONVOCATORIA NUEVA
 *   No con `nuevaEnBorrador` directamente, sino a través de `ConvocatoriaFactory`
 *   (domain/factories/). Cada tipo de beca trae sus propios requisitos, documentos y reglas
 *   de cupos, y la fábrica concreta es la que los conoce. Ver docs/06-patrones.md §1.
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
   * Reconstituye una convocatoria que YA EXISTE (viene de la base de datos).
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
   * Crea una convocatoria NUEVA, siempre en `BORRADOR` (US-006, criterio 4).
   *
   * El estado no es un parámetro: una convocatoria no puede nacer publicada. Para ser visible
   * tiene que pasar por `publicar()`, que es donde se verifican los requisitos (US-007).
   *
   * Quien debe llamar a este método es `ConvocatoriaFactory`. TypeScript no permite
   * restringirlo solo a la fábrica, así que la regla se hace cumplir en el code review.
   */
  static nuevaEnBorrador(atributos: Omit<AtributosConvocatoria, 'estado'>): Convocatoria {
    return Convocatoria.reconstituir({ ...atributos, estado: EstadoConvocatoria.BORRADOR });
  }

  get estado(): EstadoConvocatoria {
    return this._estado;
  }

  /**
   * REGLA DE NEGOCIO CENTRAL DEL LISTADO PÚBLICO (US-008).
   *
   * Una convocatoria es visible para un visitante sin cuenta solo si está PUBLICADA y su
   * fecha de cierre no ha pasado.
   *
   * Fíjense dónde vive esta regla: en la entidad, no en un `WHERE` de SQL ni en un `if`
   * del controlador. El repositorio puede optimizar la consulta filtrando en la base de
   * datos, pero la definición de "visible" es del negocio y se prueba sin base de datos.
   *
   * `ahora` se recibe por parámetro en lugar de llamar a `new Date()` dentro: el dominio
   * no depende del reloj del sistema, y así la regla se puede probar en cualquier fecha.
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
   * US-007, criterio 3: *"Una convocatoria publicada ya no permite editar sus requisitos ni
   * sus cupos."*
   *
   * La edición en sí es US-010 y no existe todavía. Este método deja la regla escrita y
   * probada desde ya, para que la edición, cuando llegue, solo tenga que preguntarle a la
   * entidad en vez de reinventar la condición en el servicio.
   */
  admiteEdicion(): boolean {
    return this._estado === EstadoConvocatoria.BORRADOR;
  }

  /**
   * US-007 — publicar la convocatoria.
   *
   * DOS ERRORES DISTINTOS A PROPÓSITO
   *   - Publicar algo que no está en BORRADOR es una **transición inválida** del ciclo de vida
   *     (HTTP 409): el problema es el estado, no los datos.
   *   - Publicar un borrador sin requisitos o sin documentos es una **regla de negocio**
   *     incumplida (HTTP 422): el estado es correcto pero el contenido no.
   *   Separarlos le dice a la interfaz qué tiene que corregir el administrador.
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
    // SE ADMITE EL 0 AL RECONSTITUIR, Y NO ES UN DESCUIDO: las convocatorias creadas antes del
    // 17 de octubre no tienen monto, y la migracion no puede inventarles uno. Un 0 significa
    // "sin monto declarado" y, por tanto, no exige segunda aprobacion. Las NUEVAS si lo exigen:
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
