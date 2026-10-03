/** Nombres legibles para los reportes. Los códigos no se imprimen: el reporte es para personas. */
export const NOMBRE_ESTADO: Readonly<Record<string, string>> = {
  ENVIADA: 'Enviada',
  EN_EVALUACION: 'En evaluación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  ADJUDICADA: 'Adjudicada',
};

export const NOMBRE_NIVEL: Readonly<Record<string, string>> = {
  NIVEL_MEDIO: 'Nivel medio',
  UNIVERSITARIO: 'Universitario',
  POSGRADO: 'Posgrado',
};

export const NOMBRE_AGRUPACION: Readonly<Record<string, string>> = {
  ESTADO: 'Estado',
  CONVOCATORIA: 'Convocatoria',
  NIVEL: 'Nivel académico',
  DEPARTAMENTO: 'Departamento',
  CENTRO_EDUCATIVO: 'Centro educativo',
};

export const SIN_DATO = 'Sin dato';

/** `2026-10-05`, en hora de Guatemala: es la fecha que la persona reconoce. */
export function fechaCorta(fecha: Date | null): string | null {
  if (fecha === null) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

export function dias(desde: Date, hasta: Date): number {
  return Math.round(((hasta.getTime() - desde.getTime()) / 86_400_000) * 10) / 10;
}
