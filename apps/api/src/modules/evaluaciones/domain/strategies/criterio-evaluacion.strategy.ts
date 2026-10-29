/**
 * Patrón Strategy. Justificación en docs/06-patrones.md §6.
 *
 * Una familia de algoritmos que, dados los datos de un solicitante, producen un puntaje, y se
 * eligen en ejecución según el tipo de beca. El servicio de evaluación no tiene un `if` sobre el
 * tipo: pide el criterio y lo usa.
 *
 * Cada criterio devuelve además el desglose de su cálculo, que se guarda con el dictamen: un
 * puntaje que asigna fondos públicos tiene que poder explicarse aunque el perfil cambie después.
 *
 * Las fórmulas son una propuesta del equipo del 16 de septiembre, pendiente de confirmar con el
 * Product Owner. Cambiarlas es cambiar una clase.
 */
import { Puntaje } from '../value-objects/puntaje.vo';

/** Lo que un criterio necesita saber del solicitante. Nada más. */
export interface DatosEvaluables {
  readonly promedio: number | null;
  readonly ingresoFamiliarMensual: number | null;
  readonly dependientes: number | null;
}

export interface LineaDesglose {
  readonly concepto: string;
  readonly valor: string;
  readonly aporte: number;
}

export interface ResultadoCriterio {
  readonly criterio: string;
  readonly puntaje: Puntaje;
  readonly desglose: readonly LineaDesglose[];
}

export interface CriterioEvaluacionStrategy {
  readonly nombre: string;
  calcular(datos: DatosEvaluables): ResultadoCriterio;
}
