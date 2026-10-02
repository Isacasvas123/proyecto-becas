/**
 * PUERTO de notificaciones (US-014, criterio 4).
 *
 * Hoy lo implementa un adaptador que escribe en el log (`NOTIFICACIONES_TIPO=consola`). El envío
 * por correo y el resto de avisos de cambio de estado son US-022 (Sprint 5, patrón Observer): se
 * agregará otro adaptador, no se tocará el caso de uso.
 */
export const NOTIFICADOR_SOLICITUDES = Symbol('NotificadorSolicitudes');

export interface AvisoSolicitudEnviada {
  readonly estudianteId: string;
  readonly numero: string;
  readonly convocatoria: string;
  readonly enviadaEn: Date;
}

export interface NotificadorSolicitudes {
  solicitudEnviada(aviso: AvisoSolicitudEnviada): Promise<void>;
}
