/**
 * CAPA: domain/events/  ·  PATRÓN OBSERVER (comportamiento)
 * ────────────────────────────────────────────────────────────────────────────────
 * Exigencia del Product Owner del 17 de octubre de 2026: *"cuando una solicitud cambie de estado,
 * el sistema deberá registrar el evento y generar una notificación para el estudiante"*.
 *
 * QUÉ PROBLEMA RESUELVE
 *   Un cambio de estado le interesa a cosas que no tienen nada que ver entre sí: al estudiante
 *   (su notificación), al log del servidor, y mañana a un correo (US-022) o a una integración con
 *   otra institución. Si cada caso de uso llamara a cada interesado, tendríamos la lista repetida
 *   en cinco servicios, y agregar un sexto interesado obligaría a tocarlos todos.
 *
 *   Con Observer, la solicitud **anuncia** lo que le pasó y no sabe quién escucha. Sumar un
 *   observador es registrar una clase más en el módulo; ningún caso de uso cambia.
 *
 * POR QUÉ EL EVENTO SE GUARDA EN LA ENTIDAD Y NO SE EMITE AL VUELO
 *   Porque la transición puede fallar al guardarse. Si se avisara dentro de `transicionar`, el
 *   estudiante recibiría la notificación de algo que después no se guardó. La entidad acumula lo
 *   que pasó y el caso de uso lo publica **después** de persistir, cuando ya es cierto.
 */
import { NombreEstado } from '../enums/solicitud.enums';

export interface EventoCambioEstado {
  readonly solicitudId: string;
  readonly numero: string;
  readonly estudianteId: string;
  /** Nulo solo en la creación: no venía de ningún estado. */
  readonly desde: NombreEstado | null;
  readonly hacia: NombreEstado;
  readonly motivo: string | null;
  readonly ocurridoEn: Date;
}

export const OBSERVADORES_SOLICITUD = Symbol('ObservadoresSolicitud');

/**
 * Un interesado en los cambios de estado.
 *
 * `notificar` NO debe lanzar: un observador que falla no puede tumbar la operación del usuario,
 * que ya ocurrió. Cada implementación se hace cargo de sus propios errores.
 */
export interface ObservadorSolicitud {
  readonly nombre: string;
  notificar(evento: EventoCambioEstado): Promise<void>;
}
