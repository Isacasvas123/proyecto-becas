/**
 * CAPA: application/services/
 *
 * Explica POR QUÉ una convocatoria no admite postulaciones en este momento.
 *
 * POR QUÉ ESTO EXISTE COMO FUNCIÓN APARTE
 *   La condición `admiteSolicitudes` es una sola, pero puede fallar por tres motivos distintos:
 *   la convocatoria todavía no abre, ya cerró, o no está publicada. La primera versión del
 *   mensaje imprimía siempre la fecha de cierre, así que a quien llegaba nueve días antes de la
 *   apertura se le mostraba una fecha del mes siguiente como si ese fuera el motivo del rechazo.
 *   Un mensaje que nombra el dato equivocado es peor que uno genérico: manda a revisar lo que
 *   está bien.
 *
 *   Vive aparte porque la necesitan dos casos de uso —crear y enviar— y porque así se prueba
 *   sin montar ninguno de los dos.
 *
 * LAS FECHAS SE ESCRIBEN A MANO Y NO CON `toLocaleDateString`
 *   El formato local depende de los datos de internacionalización que traiga el Node del
 *   contenedor. Un mensaje de error no es lugar para descubrir que ahí faltan: estos nombres
 *   son once palabras y no dependen de nada.
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
