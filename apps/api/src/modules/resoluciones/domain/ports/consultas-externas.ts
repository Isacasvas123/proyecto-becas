/**
 * PUERTOS de `resoluciones` hacia los módulos que coordina. Mismo criterio que en `solicitudes` y
 * `evaluaciones`: se declaran aquí, con palabras de este módulo, y los adaptadores de
 * `infrastructure/integraciones/` los resuelven con los servicios que esos módulos exportan.
 *
 * POR QUÉ UN MÓDULO APARTE
 *   Resolver necesita a `solicitudes` (la transición) y a `evaluaciones` (los dictámenes), y
 *   `evaluaciones` ya depende de `solicitudes`. Poner la fachada dentro de `solicitudes` crearía un
 *   ciclo entre módulos. `resoluciones` depende de todos y nadie depende de él.
 */
export const CONSULTA_SOLICITUDES_RESOLUCION = Symbol('ConsultaSolicitudesResolucion');
export const CONSULTA_DICTAMENES = Symbol('ConsultaDictamenes');
export const CONSULTA_CONVOCATORIAS_RESOLUCION = Symbol('ConsultaConvocatoriasResolucion');
export const CONSULTA_IDENTIDAD = Symbol('ConsultaIdentidad');

export type Decision = 'APROBAR' | 'RECHAZAR';

export interface SolicitudResoluble {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly ultimoCambio: string;
  readonly beca: { readonly codigo: string; readonly otorgadaEn: string } | null;
}

export interface ConsultaSolicitudesResolucion {
  buscar(id: string): Promise<SolicitudResoluble | null>;
  buscarPorNumero(numero: string): Promise<SolicitudResoluble | null>;
  /** Aprobar comprueba el cupo de forma atómica; si no hay, lanza `ReglaDeNegocioError`. */
  resolver(
    id: string,
    decision: Decision,
    motivo: string,
    autorId: string,
    cupos: number,
  ): Promise<SolicitudResoluble>;
  adjudicar(id: string, autorId: string): Promise<SolicitudResoluble>;
  ocupacion(convocatoriaId: string): Promise<{ aprobadas: number; adjudicadas: number }>;
}

export interface ConsultaDictamenes {
  resumen(solicitudId: string): Promise<{
    total: number;
    favorables: number;
    desfavorables: number;
    puntajePromedio: number | null;
  }>;
}

export interface ConvocatoriaResoluble {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly cupos: number;
}

export interface ConsultaConvocatoriasResolucion {
  buscar(id: string): Promise<ConvocatoriaResoluble | null>;
}

export interface ConsultaIdentidad {
  cuiCoincide(usuarioId: string, cui: string): Promise<boolean>;
}
