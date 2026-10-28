/**
 * Puerto de la bandeja de avisos del estudiante (US-022, PO del 17 de octubre).
 *
 * Existe porque la primera versión del servicio llamaba a Prisma directamente, lo que la regla de
 * capas prohíbe, y una prueba de integración no pudo montar el módulo sin PostgreSQL. Con el
 * puerto las pruebas usan una implementación en memoria y un destino distinto, como una cola, se
 * resuelve con otro adaptador.
 *
 * No hay `eliminar`: un aviso se marca leído, no se borra. Es el registro de que al estudiante se
 * le informó.
 */
import { NombreEstado } from '../enums/solicitud.enums';

export const NOTIFICACION_REPOSITORIO = Symbol('NotificacionRepositorio');

export interface NuevaNotificacion {
  readonly estudianteId: string;
  readonly solicitudId: string;
  readonly numero: string;
  readonly desde: NombreEstado | null;
  readonly hacia: NombreEstado;
  readonly mensaje: string;
  readonly motivo: string | null;
  readonly creadaEn: Date;
}

export interface NotificacionGuardada extends NuevaNotificacion {
  readonly id: string;
  readonly leida: boolean;
}

export interface NotificacionRepositorio {
  crear(notificacion: NuevaNotificacion): Promise<void>;
  /** Las más recientes primero, acotadas a `maximo`. */
  listar(estudianteId: string, maximo: number): Promise<NotificacionGuardada[]>;
  contarSinLeer(estudianteId: string): Promise<number>;
  /**
   * Marca una como leída. Devuelve `false` si no existe **o no es de ese estudiante**: pedir la
   * de otro no debe confirmar que existe.
   */
  marcarLeida(id: string, estudianteId: string): Promise<boolean>;
  marcarTodasLeidas(estudianteId: string): Promise<number>;
}
