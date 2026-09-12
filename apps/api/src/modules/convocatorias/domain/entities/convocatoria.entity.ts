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
 * ALCANCE (Sprint 1 · US-S1-08)
 *   El esqueleto solo necesita LEER convocatorias, así que aquí solo hay lo mínimo para
 *   representarlas y decidir si son visibles al público. La funcionalidad completa
 *   —crear, publicar, cerrar, editar— corresponde al SPRINT 3 (US-006 a US-010), junto
 *   con el `ConvocatoriaFactory` (Factory Method, docs/06-patrones.md §1).
 *   NO la implementen aquí antes de tiempo: esa es la historia de otro sprint.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { EstadoConvocatoria } from '../enums/estado-convocatoria.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
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
  readonly periodo: PeriodoPostulacion;
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
    public readonly periodo: PeriodoPostulacion,
  ) {}

  /**
   * Reconstituye una convocatoria que YA EXISTE (viene de la base de datos).
   *
   * Se llama desde el mapper de infrastructure/. Es distinta de la creación de una
   * convocatoria NUEVA, que en el Sprint 3 pasará por `ConvocatoriaFactory` porque cada
   * tipo de beca trae reglas propias (Factory Method, docs/06-patrones.md §1).
   *
   * Aun reconstituyendo, se validan las invariantes: si la base de datos tiene un dato
   * corrupto queremos enterarnos aquí y no tres capas más arriba.
   */
  static reconstituir(atributos: AtributosConvocatoria): Convocatoria {
    if (atributos.codigo.trim().length === 0) {
      throw new ReglaDeNegocioError('La convocatoria debe tener un código.');
    }
    if (atributos.titulo.trim().length === 0) {
      throw new ReglaDeNegocioError('La convocatoria debe tener un título.');
    }
    if (!Number.isInteger(atributos.cupos) || atributos.cupos <= 0) {
      throw new ReglaDeNegocioError('El número de cupos debe ser un entero mayor que cero.');
    }

    return new Convocatoria(
      atributos.id,
      atributos.codigo,
      atributos.titulo,
      atributos.descripcion,
      atributos.tipo,
      atributos.estado,
      atributos.cupos,
      atributos.periodo,
    );
  }

  get estado(): EstadoConvocatoria {
    return this._estado;
  }

  /**
   * REGLA DE NEGOCIO CENTRAL DEL ESQUELETO (US-008).
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

  /** ¿Se pueden presentar solicitudes en este momento? Lo usará US-012 en el Sprint 4. */
  admiteSolicitudes(ahora: Date): boolean {
    return this._estado === EstadoConvocatoria.PUBLICADA && this.periodo.contiene(ahora);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SPRINT 3 — US-007 `publicar()`, US-009 `cerrar()`, US-010 `editarBorrador()`.
  // Aquí van los cambios de estado, cada uno validando que la transición sea legal
  // y lanzando `TransicionInvalidaError` cuando no lo sea.
  // Deliberadamente NO implementados en el walking skeleton.
  // ────────────────────────────────────────────────────────────────────────────
}
