/**
 * Patrón Observer. Pedido por el Product Owner el 17 de octubre: cuando una solicitud cambie de
 * estado, el sistema debe registrar el evento y generar una notificación para el estudiante.
 *
 * Un cambio de estado le interesa a cosas sin relación entre sí: la notificación, el log y, más
 * adelante, un correo (US-022). Si cada caso de uso llamara a cada interesado, la lista estaría
 * repetida en cinco servicios. Con Observer la solicitud anuncia lo que le pasó y no sabe quién
 * escucha: sumar un observador es registrar una clase más.
 *
 * El evento se guarda en la entidad y no se emite al vuelo porque la transición puede fallar al
 * guardarse y el estudiante recibiría el aviso de algo que no ocurrió. La entidad acumula y el
 * caso de uso publica después de persistir.
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
