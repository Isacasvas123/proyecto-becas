/**
 * CAPA: infrastructure/notificaciones/  ·  OBSERVADOR del cambio de estado
 * ────────────────────────────────────────────────────────────────────────────────
 * Crea la notificación del estudiante (US-022; exigida por el PO el 17 de octubre de 2026).
 *
 * NO LANZA NUNCA
 *   Si la notificación no se puede guardar, el cambio de estado ya ocurrió y es válido. Se deja
 *   constancia en el log y la operación sigue. Lo contrario —tumbar una aprobación porque falló
 *   un aviso— sería poner el accesorio por encima de lo esencial.
 *
 * EL TEXTO VIVE AQUÍ, NO EN EL DOMINIO
 *   El dominio sabe que una solicitud pasó de EN_EVALUACION a APROBADA; cómo se le cuenta eso a
 *   una persona es cosa de presentación. Si mañana cambia la redacción, o hay que traducirla, no
 *   se toca ninguna regla de negocio.
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
  // Nunca se usa: crear una solicitud no es un CAMBIO de estado, es el inicial. Está por
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
