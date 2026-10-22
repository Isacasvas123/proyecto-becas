/**
 * CAPA: domain/ports/
 * ────────────────────────────────────────────────────────────────────────────────
 * Puerto de la bandeja de avisos del estudiante (US-022; PO, 17 Oct 2026).
 *
 * POR QUÉ EXISTE, SI PRISMA YA SABE HACER ESTO
 *   La primera versión del servicio llamaba a Prisma directamente, y la regla de capas del
 *   proyecto lo prohíbe: `application` no conoce la base de datos. Además lo delató una prueba de
 *   integración, que no pudo montar el módulo sin arrastrar PostgreSQL. Con el puerto, las
 *   pruebas usan una implementación en memoria y el día que los avisos vivan en otro sitio
 *   —una cola, un servicio externo— se escribe otro adaptador.
 *
 * NO HAY `eliminar`: un aviso se marca leído, no se borra. Es el registro de que al estudiante se
 * le informó, y eso es parte de la trazabilidad que pidió el Product Owner.
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
