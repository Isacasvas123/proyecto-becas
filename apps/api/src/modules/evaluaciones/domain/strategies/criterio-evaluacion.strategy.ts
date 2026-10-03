/**
 * CAPA: domain/strategies/  ·  PATRÓN STRATEGY (comportamiento)
 * ────────────────────────────────────────────────────────────────────────────────
 * Justificación completa en docs/06-patrones.md §6.
 *
 * Una familia de algoritmos que resuelven la misma tarea —dados los datos de un solicitante,
 * producir un puntaje— y que se eligen en tiempo de ejecución según el tipo de beca. El servicio de
 * evaluación no tiene ni un `if` sobre el tipo: pide el criterio y lo usa.
 *
 * EL DESGLOSE NO ES DECORACIÓN
 *   Cada criterio devuelve, además del puntaje, de dónde sale: qué dato se usó y cuánto aportó.
 *   Queda guardado con el dictamen. Un puntaje que asigna fondos públicos tiene que poder
 *   explicarse después, aunque el perfil del estudiante haya cambiado.
 *
 * LAS FÓRMULAS SON PROVISIONALES
 *   El enunciado no las fija. Las actuales son la propuesta del equipo del 16 Sep y están
 *   pendientes de confirmar con el Product Owner. Cambiarlas es cambiar una clase, no el sistema.
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
