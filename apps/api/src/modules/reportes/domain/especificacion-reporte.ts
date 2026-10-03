/**
 * CAPA: domain/
 * ────────────────────────────────────────────────────────────────────────────────
 * Qué se pide en un reporte de solicitudes (US-028). La construye `ReporteBuilder`; nadie más
 * debería crearla a mano, porque el builder es quien comprueba que la combinación tenga sentido.
 */
export const ESTADOS_REPORTABLES = [
  'ENVIADA',
  'EN_EVALUACION',
  'APROBADA',
  'RECHAZADA',
  'ADJUDICADA',
] as const;
export type EstadoReportable = (typeof ESTADOS_REPORTABLES)[number];

export const NIVELES = ['NIVEL_MEDIO', 'UNIVERSITARIO', 'POSGRADO'] as const;
export type Nivel = (typeof NIVELES)[number];

export const AGRUPACIONES = [
  'ESTADO',
  'CONVOCATORIA',
  'NIVEL',
  'DEPARTAMENTO',
  'CENTRO_EDUCATIVO',
] as const;
export type Agrupacion = (typeof AGRUPACIONES)[number];

export const ORDENES = ['NUMERO', 'ENVIO_RECIENTE', 'ENVIO_ANTIGUO'] as const;
export type Orden = (typeof ORDENES)[number];

export const FORMATOS = ['JSON', 'CSV', 'PDF'] as const;
export type Formato = (typeof FORMATOS)[number];

export interface EspecificacionReporte {
  readonly convocatoriaId: string | null;
  readonly estados: readonly EstadoReportable[] | null;
  readonly nivel: Nivel | null;
  readonly departamento: string | null;
  /** Fecha de envío, inclusiva. */
  readonly desde: Date | null;
  readonly hasta: Date | null;
  readonly agrupacion: Agrupacion | null;
  readonly orden: Orden;
  readonly formato: Formato;
}
