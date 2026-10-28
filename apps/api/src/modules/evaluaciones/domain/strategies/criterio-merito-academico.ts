import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Puntaje } from '../value-objects/puntaje.vo';
import {
  CriterioEvaluacionStrategy,
  DatosEvaluables,
  ResultadoCriterio,
} from './criterio-evaluacion.strategy';

/**
 * Mérito académico: el puntaje es el promedio del estudiante (0 a 100).
 *
 * Es el criterio de nivel medio y posgrado. El esquema original sumaba "reconocimientos", pero
 * ese dato no existe en el perfil (US-011 no lo pide) y no se inventa un campo para una fórmula.
 */
export class CriterioMeritoAcademico implements CriterioEvaluacionStrategy {
  readonly nombre = 'Mérito académico';

  calcular(datos: DatosEvaluables): ResultadoCriterio {
    if (datos.promedio === null) {
      throw new ReglaDeNegocioError(
        'No se puede evaluar el mérito sin el promedio del estudiante.',
      );
    }
    const puntaje = Puntaje.de(datos.promedio);
    return {
      criterio: this.nombre,
      puntaje,
      desglose: [{ concepto: 'Promedio', valor: String(datos.promedio), aporte: puntaje.valor }],
    };
  }
}
