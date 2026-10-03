/**
 * Qué criterio usa cada tipo de beca (propuesta del 16 Sep, pendiente de confirmar con el PO).
 *
 * Es el único lugar del sistema que relaciona tipos con criterios. Un tipo de beca nuevo sin
 * criterio es un error explícito, no un puntaje silencioso de cero.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { CriterioEvaluacionStrategy } from './criterio-evaluacion.strategy';
import { CriterioMeritoAcademico } from './criterio-merito-academico';
import { CriterioMixto } from './criterio-mixto';
import { CriterioNecesidadSocioeconomica } from './criterio-necesidad-socioeconomica';

/** Peso del mérito en la beca universitaria. El resto es necesidad. */
export const PESO_ACADEMICO_UNIVERSITARIA = 0.6;

const merito = new CriterioMeritoAcademico();
const necesidad = new CriterioNecesidadSocioeconomica();

const CRITERIOS: Readonly<Record<string, CriterioEvaluacionStrategy>> = {
  NIVEL_MEDIO: merito,
  UNIVERSITARIA: new CriterioMixto(merito, necesidad, PESO_ACADEMICO_UNIVERSITARIA),
  POSGRADO: merito,
};

export function criterioPara(tipoBeca: string): CriterioEvaluacionStrategy {
  const criterio = CRITERIOS[tipoBeca];
  if (criterio === undefined) {
    throw new ReglaDeNegocioError(
      `No hay criterio de evaluación para el tipo de beca ${tipoBeca}.`,
    );
  }
  return criterio;
}
