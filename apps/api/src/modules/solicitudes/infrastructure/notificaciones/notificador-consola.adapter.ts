import { Injectable, Logger } from '@nestjs/common';

import { NotificadorSolicitudes } from '../../domain/ports/notificador-solicitudes';

/** `NOTIFICACIONES_TIPO=consola`: en desarrollo, los avisos se leen en el log de la API. */
@Injectable()
export class NotificadorConsolaAdapter implements NotificadorSolicitudes {
  private readonly logger = new Logger('Notificaciones');

  solicitudEnviada(aviso: {
    estudianteId: string;
    numero: string;
    convocatoria: string;
    enviadaEn: Date;
  }): Promise<void> {
    this.logger.log(
      `Para el estudiante ${aviso.estudianteId}: su solicitud ${aviso.numero} a "${aviso.convocatoria}" ` +
        `se recibió el ${aviso.enviadaEn.toISOString()}.`,
    );
    return Promise.resolve();
  }
}
