/**
 * Funciones de presentación compartidas.
 *
 * Viven aparte de los componentes porque son lógica pura y se pueden probar sin
 * renderizar nada. Ninguna toca la API: solo dan forma a datos que ya llegaron.
 */

export const TIPOS_BECA = ['NIVEL_MEDIO', 'UNIVERSITARIA', 'POSGRADO'] as const;

/**
 * «1 cupo», «3 cupos». Nunca «1 cupos» ni «3 cupo(s)».
 *
 * La forma con paréntesis ahorra trabajo a quien escribe el mensaje y se lo pasa a quien lo
 * lee. En una pantalla que va a ver gente que está pidiendo una beca, la concordancia no es
 * un capricho de estilo: es la diferencia entre un sistema cuidado y uno armado a la carrera.
 */
export function cantidad(n: number, singular: string, plural: string): string {
  return `${n.toLocaleString('es-GT')} ${n === 1 ? singular : plural}`;
}

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
  clase: 'holgado' | 'urgente' | 'cerrado' | 'proximo';
  /** ¿Se puede postular ahora mismo? Lo usa el botón de la tarjeta. */
  abierta: boolean;
}

/**
 * Traduce el periodo de postulación al indicador de plazo.
 *
 * El umbral de 15 días para marcar urgencia no es arbitrario: reunir los
 * documentos exigidos —certificaciones, constancias, cartas de recomendación—
 * toma tiempo, y avisar con dos semanas es lo mínimo útil para el aspirante.
 *
 * LA APERTURA SE MIRA ANTES QUE EL CIERRE, Y POR QUÉ IMPORTA
 *   La primera versión solo miraba la fecha de cierre. Una convocatoria que
 *   abría dentro de nueve días se mostraba como «Cierra en 38 días», con su
 *   botón de postular habilitado, y el aspirante solo se enteraba de que no
 *   podía postular cuando el servidor lo rechazaba. El periodo tiene dos
 *   extremos; mirar uno solo deja al usuario adivinando el otro.
 */
export function estadoPlazo(
  isoCierre: string,
  isoApertura?: string,
  ahora: Date = new Date(),
): EstadoPlazo {
  if (isoApertura !== undefined && new Date(isoApertura).getTime() > ahora.getTime()) {
    const dias = diasRestantes(isoApertura, ahora);
    const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
    return { texto: `Abre ${cuando}`, clase: 'proximo', abierta: false };
  }

  const dias = diasRestantes(isoCierre, ahora);

  if (dias < 0) return { texto: 'Convocatoria cerrada', clase: 'cerrado', abierta: false };
  if (dias === 0) return { texto: 'Cierra hoy', clase: 'urgente', abierta: true };
  if (dias === 1) return { texto: 'Cierra mañana', clase: 'urgente', abierta: true };
  if (dias <= 15) return { texto: `Últimos ${dias} días`, clase: 'urgente', abierta: true };

  return { texto: `Cierra ${enPalabras(dias)}`, clase: 'holgado', abierta: true };
}

/**
 * Convierte una cantidad de días en algo que una persona pueda usar.
 *
 * Nadie hace nada con «cierra en 26733 días»: a partir de un par de meses el número de días deja
 * de informar y empieza a estorbar. Se cambia de unidad igual que se hace al hablar —días,
 * meses, años— porque el dato que importa no es la cifra exacta, es si hay que apurarse.
 */
function enPalabras(dias: number): string {
  if (dias <= 60) return `en ${dias} días`;

  const meses = Math.round(dias / 30);
  if (meses < 12) return `en ${meses} meses`;

  const años = Math.floor(dias / 365);
  return años === 1 ? 'en más de un año' : `en más de ${años} años`;
}

/** Nombre legible de cada estado de una solicitud (patrón State en el backend). */
const NOMBRE_ESTADO_SOLICITUD: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  EN_EVALUACION: 'En evaluación',
  // PO, 17 Oct 2026: beca de más de Q10,000 con una firma, esperando la segunda.
  APROBACION_PENDIENTE: 'Espera segunda aprobación',
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
export const NOMBRE_DEPARTAMENTO: Record<string, string> = {
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

/** Q25,000. Sin centavos: el dominio guarda quetzales enteros. */
export function formatearQuetzales(monto: number): string {
  return `Q${monto.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Da forma al monto MIENTRAS la persona lo escribe, en el campo de la convocatoria.
 *
 * POR QUÉ NO SE USA UN `<input type="number">` A SECAS
 *   Un campo numérico crudo acepta «15000» y lo muestra «15000»: nadie distingue de un
 *   vistazo quince mil de ciento cincuenta mil, y un cero de más en el monto de una beca
 *   no es un detalle estético. Con separadores de millar el error salta a la vista.
 *
 * La función es tolerante a propósito: acepta lo que la gente realmente teclea —comas,
 * espacios, una Q delante— y se queda con los dígitos. Devuelve el texto ya formateado y
 * el número limpio, para que el componente muestre uno y envíe el otro.
 */
export function formatearMontoEscrito(texto: string): { texto: string; valor: number } {
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digitos === '') return { texto: '', valor: 0 };

  const valor = Number(digitos);
  return { texto: valor.toLocaleString('es-GT'), valor };
}
