/**
 * Observador que crea la notificación del estudiante (US-022, PO del 17 de octubre).
 *
 * No lanza nunca: si el aviso no se puede guardar, el cambio de estado ya ocurrió y es válido. Se
 * deja constancia en el log y la operación sigue.
 *
 * El texto vive aquí y no en el dominio: el dominio sabe que una solicitud pasó a APROBADA, y
 * cómo se le cuenta eso a una persona es presentación. Cambiar la redacción no toca ninguna regla.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  NOTIFICACION_REPOSITORIO,
  NotificacionRepositorio,
} from '../../domain/ports/notificacion.repositorio';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { EventoCambioEstado, ObservadorSolicitud } from '../../domain/events/evento-solicitud';

/** Qué se le dice al estudiante en cada estado al que llega su solicitud. */
const MENSAJE: Record<NombreEstado, (numero: string) => string> = {
  // Nunca se usa: crear una solicitud no es un cambio de estado, es el inicial. Está por
  // exhaustividad del Record, para que agregar un estado nuevo al enum no compile sin su mensaje.
  [NombreEstado.BORRADOR]: (n) => `Creó la solicitud ${n}.`,
  [NombreEstado.ENVIADA]: (n) => `Recibimos su solicitud ${n}. Queda a la espera de evaluación.`,
  [NombreEstado.EN_EVALUACION]: (n) => `Su solicitud ${n} pasó a evaluación por un comité.`,
  [NombreEstado.APROBACION_PENDIENTE]: (n) =>
    `Su solicitud ${n} recibió una primera aprobación. Por el monto de la beca, falta una segunda revisión.`,
  [NombreEstado.APROBADA]: (n) => `Su solicitud ${n} fue aprobada. Espere la adjudicación.`,
  [NombreEstado.RECHAZADA]: (n) => `Su solicitud ${n} fue rechazada. Puede ver el motivo aquí.`,
  [NombreEstado.ADJUDICADA]: (n) => `Le adjudicaron la beca de la solicitud ${n}.`,
};

@Injectable()
export class NotificadorEstudianteObservador implements ObservadorSolicitud {
  readonly nombre = 'notificacion-estudiante';
  private readonly logger = new Logger(NotificadorEstudianteObservador.name);

  constructor(
    @Inject(NOTIFICACION_REPOSITORIO)
    private readonly repositorio: NotificacionRepositorio,
  ) {}

  async notificar(evento: EventoCambioEstado): Promise<void> {
    try {
      await this.repositorio.crear({
        estudianteId: evento.estudianteId,
        solicitudId: evento.solicitudId,
        numero: evento.numero,
        desde: evento.desde,
        hacia: evento.hacia,
        mensaje: MENSAJE[evento.hacia](evento.numero),
        motivo: evento.motivo,
        creadaEn: evento.ocurridoEn,
      });
    } catch (causa: unknown) {
      const motivo = causa instanceof Error ? causa.message : String(causa);
      this.logger.error(`No se pudo notificar ${evento.numero} → ${evento.hacia}: ${motivo}`);
    }
  }
}
