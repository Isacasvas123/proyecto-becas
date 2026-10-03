/**
 * Funciones de presentación compartidas.
 *
 * Viven aparte de los componentes porque son lógica pura y se pueden probar sin
 * renderizar nada. Ninguna toca la API: solo dan forma a datos que ya llegaron.
 */

export const TIPOS_BECA = ['NIVEL_MEDIO', 'UNIVERSITARIA', 'POSGRADO'] as const;

/** Nombre legible de cada tipo de beca. El backend devuelve el enum en crudo. */
export function nombreTipo(tipo: string): string {
  switch (tipo) {
    case 'NIVEL_MEDIO':
      return 'Nivel medio';
    case 'UNIVERSITARIA':
      return 'Universitaria';
    case 'POSGRADO':
      return 'Posgrado';
    default:
      return tipo.replace(/_/g, ' ').toLowerCase();
  }
}

/**
 * Letra que se muestra en el sello de la tarjeta, al estilo del logotipo de la
 * empresa en una oferta de empleo. Da un ancla visual rápida al escanear la lista.
 */
export function inicialTipo(tipo: string): string {
  switch (tipo) {
    case 'NIVEL_MEDIO':
      return 'NM';
    case 'UNIVERSITARIA':
      return 'U';
    case 'POSGRADO':
      return 'PG';
    default:
      return '·';
  }
}

/** Sufijo de clase CSS para colorear tarjeta, sello y etiqueta por tipo. */
export function claseTipo(tipo: string): string {
  return `t-${tipo.toLowerCase()}`;
}

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Días completos que faltan para el cierre.
 *
 * Se comparan fechas a medianoche y no instantes: para un aspirante, una
 * convocatoria que cierra "hoy a las 23:59" sigue siendo hoy, y redondear por
 * horas daría "0 días" desde la mañana, que confunde.
 */
export function diasRestantes(isoCierre: string, ahora: Date = new Date()): number {
  const cierre = new Date(isoCierre);
  const aMedianoche = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((aMedianoche(cierre) - aMedianoche(ahora)) / 86_400_000);
}

export interface EstadoPlazo {
  texto: string;
  clase: 'holgado' | 'urgente' | 'cerrado';
}

/**
 * Traduce los días restantes al indicador de plazo.
 *
 * El umbral de 15 días para marcar urgencia no es arbitrario: reunir los
 * documentos exigidos —certificaciones, constancias, cartas de recomendación—
 * toma tiempo, y avisar con dos semanas es lo mínimo útil para el aspirante.
 */
export function estadoPlazo(isoCierre: string, ahora: Date = new Date()): EstadoPlazo {
  const dias = diasRestantes(isoCierre, ahora);

  if (dias < 0) return { texto: 'Convocatoria cerrada', clase: 'cerrado' };
  if (dias === 0) return { texto: 'Cierra hoy', clase: 'urgente' };
  if (dias === 1) return { texto: 'Cierra mañana', clase: 'urgente' };
  if (dias <= 15) return { texto: `Últimos ${dias} días`, clase: 'urgente' };

  return { texto: `Cierra en ${dias} días`, clase: 'holgado' };
}

/** Nombre legible de cada estado de una solicitud (patrón State en el backend). */
const NOMBRE_ESTADO_SOLICITUD: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  EN_EVALUACION: 'En evaluación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  ADJUDICADA: 'Adjudicada',
};

export function nombreEstadoSolicitud(estado: string): string {
  return NOMBRE_ESTADO_SOLICITUD[estado] ?? estado;
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Nombre de cada departamento. El servidor guarda el código (catálogo cerrado, ver US-031); la
 * misma lista vive en el backend y la expone `GET /estudiantes/departamentos` para el formulario.
 */
const NOMBRE_DEPARTAMENTO: Record<string, string> = {
  ALTA_VERAPAZ: 'Alta Verapaz',
  BAJA_VERAPAZ: 'Baja Verapaz',
  CHIMALTENANGO: 'Chimaltenango',
  CHIQUIMULA: 'Chiquimula',
  EL_PROGRESO: 'El Progreso',
  ESCUINTLA: 'Escuintla',
  GUATEMALA: 'Guatemala',
  HUEHUETENANGO: 'Huehuetenango',
  IZABAL: 'Izabal',
  JALAPA: 'Jalapa',
  JUTIAPA: 'Jutiapa',
  PETEN: 'Petén',
  QUETZALTENANGO: 'Quetzaltenango',
  QUICHE: 'Quiché',
  RETALHULEU: 'Retalhuleu',
  SACATEPEQUEZ: 'Sacatepéquez',
  SAN_MARCOS: 'San Marcos',
  SANTA_ROSA: 'Santa Rosa',
  SOLOLA: 'Sololá',
  SUCHITEPEQUEZ: 'Suchitepéquez',
  TOTONICAPAN: 'Totonicapán',
  ZACAPA: 'Zacapa',
};

export function nombreDepartamento(codigo: string | null): string | null {
  return codigo === null ? null : (NOMBRE_DEPARTAMENTO[codigo] ?? codigo);
}
