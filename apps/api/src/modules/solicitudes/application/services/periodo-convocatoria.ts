/**
 * Explica por qué una convocatoria no admite postulaciones en este momento.
 *
 * `admiteSolicitudes` es una condición, pero falla por tres motivos: aún no abre, ya cerró o no
 * está publicada. La primera versión del mensaje imprimía siempre la fecha de cierre, así que a
 * quien llegaba antes de la apertura se le señalaba el dato equivocado. Un mensaje que nombra lo
 * que está bien es peor que uno genérico.
 *
 * Es una función aparte porque la usan dos casos de uso (crear y enviar) y se prueba sin montar
 * ninguno. Las fechas se escriben a mano y no con `toLocaleDateString`, porque el formato local
 * depende de los datos de internacionalización del Node del contenedor.
 */

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Fecha en el huso de Guatemala (UTC-6), que es donde están las personas que leen esto. */
export function fechaLegible(fecha: Date): string {
  const local = new Date(fecha.getTime() - 6 * 60 * 60 * 1000);
  return `${local.getUTCDate()} de ${MESES[local.getUTCMonth()]} de ${local.getUTCFullYear()}`;
}

interface PeriodoDeConvocatoria {
  readonly codigo: string;
  readonly fechaApertura: Date;
  readonly fechaCierre: Date;
}

export function explicarPeriodo(convocatoria: PeriodoDeConvocatoria, ahora: Date): string {
  if (ahora.getTime() < convocatoria.fechaApertura.getTime()) {
    return (
      `La convocatoria ${convocatoria.codigo} todavía no abre: ` +
      `recibe postulaciones a partir del ${fechaLegible(convocatoria.fechaApertura)}.`
    );
  }

  if (ahora.getTime() > convocatoria.fechaCierre.getTime()) {
    return (
      `La convocatoria ${convocatoria.codigo} ya cerró: ` +
      `el plazo terminó el ${fechaLegible(convocatoria.fechaCierre)}.`
    );
  }

  // Dentro del periodo y aun así rechazada: la convocatoria no está publicada. No se dice más,
  // porque un borrador no debería ser visible para quien intenta postular.
  return `La convocatoria ${convocatoria.codigo} no está recibiendo postulaciones.`;
}
