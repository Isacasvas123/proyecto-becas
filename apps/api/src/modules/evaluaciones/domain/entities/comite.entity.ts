/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * Comité evaluador de una convocatoria (US-017, CU-13).
 *
 * Reglas del caso de uso que viven aquí:
 *   - Al menos un evaluador y ninguno repetido (flujo 6a).
 *   - Nombre obligatorio.
 *   - Quién lo creó y cuándo (paso 7).
 * "Una convocatoria, un comité" (flujo 3a) no se puede comprobar desde una sola entidad: lo
 * comprueba el caso de uso y lo garantiza el índice único de la base.
 *
 * El reparto equitativo (US-018, criterio 4) también está aquí porque es una regla sobre los
 * integrantes del comité, y se prueba sin base de datos.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export interface AtributosComite {
  readonly id: string;
  readonly nombre: string;
  readonly convocatoriaId: string;
  readonly evaluadores: readonly string[];
  readonly creadoPor: string;
  readonly creadoEn: Date;
}

/** Una solicitud asignada a un evaluador de un comité. */
export interface Asignacion {
  readonly comiteId: string;
  readonly solicitudId: string;
  readonly evaluadorId: string;
  readonly asignadaPor: string;
  readonly asignadaEn: Date;
}

export class Comite {
  private readonly _evaluadores: string[];

  private constructor(private readonly atributos: AtributosComite) {
    this._evaluadores = [...atributos.evaluadores];
  }

  static nuevo(datos: AtributosComite): Comite {
    const nombre = datos.nombre.trim().replace(/\s+/g, ' ');
    if (nombre.length < 3) {
      throw new ReglaDeNegocioError('El comité necesita un nombre.');
    }
    Comite.validarIntegrantes(datos.evaluadores);
    return new Comite({ ...datos, nombre });
  }

  static reconstituir(atributos: AtributosComite): Comite {
    return new Comite(atributos);
  }

  get id(): string {
    return this.atributos.id;
  }
  get nombre(): string {
    return this.atributos.nombre;
  }
  get convocatoriaId(): string {
    return this.atributos.convocatoriaId;
  }
  get creadoPor(): string {
    return this.atributos.creadoPor;
  }
  get creadoEn(): Date {
    return this.atributos.creadoEn;
  }
  get evaluadores(): readonly string[] {
    return [...this._evaluadores];
  }

  esIntegrante(evaluadorId: string): boolean {
    return this._evaluadores.includes(evaluadorId);
  }

  /** Suma integrantes. Quitar no existe todavía: ver el flujo 5a de CU-13 en el manual técnico. */
  agregarEvaluadores(ids: readonly string[]): void {
    const nuevos = ids.filter((id) => !this._evaluadores.includes(id));
    if (nuevos.length === 0) {
      throw new ReglaDeNegocioError('Esas personas ya forman parte del comité.');
    }
    Comite.validarIntegrantes(nuevos);
    this._evaluadores.push(...nuevos);
  }

  /**
   * US-018, criterio 4 — reparto automático equitativo.
   *
   * Cada solicitud va a los `porSolicitud` integrantes con MENOS carga en ese momento, contando la
   * que ya tenían. Así, repartir en dos tandas deja el mismo equilibrio que repartir de una vez. A
   * igual carga se respeta el orden del comité, para que el resultado sea predecible y probable.
   */
  repartir(
    solicitudIds: readonly string[],
    porSolicitud: number,
    cargaActual: ReadonlyMap<string, number>,
  ): { solicitudId: string; evaluadorId: string }[] {
    if (!Number.isInteger(porSolicitud) || porSolicitud < 1) {
      throw new ReglaDeNegocioError('Cada solicitud necesita al menos un evaluador.');
    }
    if (porSolicitud > this._evaluadores.length) {
      throw new ReglaDeNegocioError(
        `El comité tiene ${this._evaluadores.length} integrante(s); no se pueden asignar ${porSolicitud} por solicitud.`,
      );
    }

    const carga = new Map(this._evaluadores.map((id) => [id, cargaActual.get(id) ?? 0]));
    const plan: { solicitudId: string; evaluadorId: string }[] = [];

    for (const solicitudId of solicitudIds) {
      const elegidos = [...this._evaluadores]
        .map((id, orden) => ({ id, orden, carga: carga.get(id) ?? 0 }))
        .sort((a, b) => a.carga - b.carga || a.orden - b.orden)
        .slice(0, porSolicitud);
      for (const { id } of elegidos) {
        plan.push({ solicitudId, evaluadorId: id });
        carga.set(id, (carga.get(id) ?? 0) + 1);
      }
    }
    return plan;
  }

  private static validarIntegrantes(ids: readonly string[]): void {
    if (ids.length === 0) {
      throw new ReglaDeNegocioError('Un comité necesita al menos un evaluador.');
    }
    if (new Set(ids).size !== ids.length) {
      throw new ReglaDeNegocioError('Hay evaluadores repetidos en el comité.');
    }
  }
}
