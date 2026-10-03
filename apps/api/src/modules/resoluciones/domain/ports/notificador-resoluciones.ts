/**
 * PUERTO de avisos al estudiante cuando su solicitud se resuelve o se adjudica. Hoy lo implementa
 * un adaptador de consola; el correo es US-022.
 */
export const NOTIFICADOR_RESOLUCIONES = Symbol('NotificadorResoluciones');

export interface AvisoResolucion {
  readonly estudianteId: string;
  readonly numero: string;
  readonly estado: string;
  readonly motivo: string | null;
  readonly codigoBeca: string | null;
}

export interface NotificadorResoluciones {
  cambioDeEstado(aviso: AvisoResolucion): Promise<void>;
}
