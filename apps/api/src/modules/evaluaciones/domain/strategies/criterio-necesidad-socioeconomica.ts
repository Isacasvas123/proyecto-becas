import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Puntaje } from '../value-objects/puntaje.vo';
import {
  CriterioEvaluacionStrategy,
  DatosEvaluables,
  ResultadoCriterio,
} from './criterio-evaluacion.strategy';

/** Por debajo de este ingreso por persona, la necesidad es máxima: 100 puntos. */
export const INGRESO_PER_CAPITA_MINIMO = 500;
/** Desde este ingreso por persona, la necesidad es nula: 0 puntos. */
export const INGRESO_PER_CAPITA_MAXIMO = 5000;

/**
 * Necesidad socioeconómica: menos ingreso por persona, más puntos.
 *
 *   ingreso por persona = ingreso familiar mensual ÷ personas que dependen de él (mínimo 1)
 *   puntaje = 100 si ≤ Q500 · 0 si ≥ Q5,000 · lineal en medio
 *
 * Se divide entre los dependientes porque Q4,000 no significan lo mismo para un hogar de dos que
 * para uno de seis. Los umbrales son constantes con nombre porque el Product Owner querrá
 * ajustarlos.
 */
export class CriterioNecesidadSocioeconomica implements CriterioEvaluacionStrategy {
  readonly nombre = 'Necesidad socioeconómica';

  calcular(datos: DatosEvaluables): ResultadoCriterio {
    if (datos.ingresoFamiliarMensual === null || datos.dependientes === null) {
      throw new ReglaDeNegocioError(
        'No se puede evaluar la necesidad sin el ingreso familiar y el número de dependientes.',
      );
    }
    const personas = Math.max(1, datos.dependientes);
    const perCapita = datos.ingresoFamiliarMensual / personas;
    const tramo = INGRESO_PER_CAPITA_MAXIMO - INGRESO_PER_CAPITA_MINIMO;
    const puntaje = Puntaje.de(((INGRESO_PER_CAPITA_MAXIMO - perCapita) / tramo) * 100);

    return {
      criterio: this.nombre,
      puntaje,
      desglose: [
        {
          concepto: 'Ingreso por persona',
          valor: `Q${perCapita.toFixed(2)} (Q${datos.ingresoFamiliarMensual} ÷ ${personas})`,
          aporte: puntaje.valor,
        },
      ],
    };
  }
}
