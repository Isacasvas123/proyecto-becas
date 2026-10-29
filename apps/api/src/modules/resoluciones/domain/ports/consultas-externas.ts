/**
 * Puertos de `resoluciones` hacia los módulos que coordina, declarados con palabras de este
 * módulo; los adaptadores de `infrastructure/integraciones/` los resuelven con los servicios que
 * esos módulos exportan.
 *
 * Es un módulo aparte porque resolver necesita a `solicitudes` y a `evaluaciones`, y
 * `evaluaciones` ya depende de `solicitudes`: la fachada dentro de `solicitudes` crearía un ciclo.
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
  /** Segunda aprobacion (PO, 17 Oct 2026). Reserva el cupo, como una aprobacion normal. */
  confirmarAprobacion(
    id: string,
    motivo: string,
    autorId: string,
    cupos: number,
  ): Promise<SolicitudResoluble>;
  adjudicar(id: string, autorId: string): Promise<SolicitudResoluble>;
  /** PO, 22 Oct 2026: nadie debe recibir dos becas a la vez. Ver la fachada. */
  tieneBecaAdjudicada(estudianteId: string, exceptoSolicitudId: string): Promise<boolean>;
  ocupacion(convocatoriaId: string): Promise<{ aprobadas: number; adjudicadas: number }>;
  ocupacionDe(
    convocatoriaIds: readonly string[],
  ): Promise<Map<string, { aprobadas: number; adjudicadas: number }>>;
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
  /** Las que el público ve listadas, para poder decir cuántos cupos les quedan. */
  publicadasVigentes(): Promise<readonly { id: string; cupos: number }[]>;
  buscar(id: string): Promise<ConvocatoriaResoluble | null>;
}

export interface ConsultaIdentidad {
  cuiCoincide(usuarioId: string, cui: string): Promise<boolean>;
}
