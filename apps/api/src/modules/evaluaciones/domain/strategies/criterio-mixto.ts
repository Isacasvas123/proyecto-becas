import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Puntaje } from '../value-objects/puntaje.vo';
import {
  CriterioEvaluacionStrategy,
  DatosEvaluables,
  ResultadoCriterio,
} from './criterio-evaluacion.strategy';

/**
 * Mixto: COMPONE otros dos criterios con un peso, en vez de repetir sus fórmulas.
 *
 * Si mañana cambia la fórmula de necesidad, el mixto la hereda sin tocarse. Composición sobre
 * herencia: es la flecha `o--` del diagrama de clases.
 */
export class CriterioMixto implements CriterioEvaluacionStrategy {
  readonly nombre: string;

  constructor(
    private readonly academico: CriterioEvaluacionStrategy,
    private readonly social: CriterioEvaluacionStrategy,
    private readonly pesoAcademico: number,
  ) {
    if (!(pesoAcademico >= 0 && pesoAcademico <= 1)) {
      throw new ReglaDeNegocioError('El peso del criterio mixto debe estar entre 0 y 1.');
    }
    const porcentaje = Math.round(pesoAcademico * 100);
    this.nombre = `Mixto (${porcentaje} % ${academico.nombre.toLowerCase()} · ${
      100 - porcentaje
    } % ${social.nombre.toLowerCase()})`;
  }

  calcular(datos: DatosEvaluables): ResultadoCriterio {
    const a = this.academico.calcular(datos);
    const s = this.social.calcular(datos);
    const pesoSocial = 1 - this.pesoAcademico;

    return {
      criterio: this.nombre,
      puntaje: Puntaje.de(a.puntaje.valor * this.pesoAcademico + s.puntaje.valor * pesoSocial),
      desglose: [
        ...a.desglose.map((l) => ({ ...l, aporte: redondear(l.aporte * this.pesoAcademico) })),
        ...s.desglose.map((l) => ({ ...l, aporte: redondear(l.aporte * pesoSocial) })),
      ],
    };
  }
}

const redondear = (n: number) => Math.round(n * 100) / 100;
