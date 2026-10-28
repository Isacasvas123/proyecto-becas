/**
 * Sujeto del patrón Observer: entrega cada cambio de estado a los observadores registrados.
 *
 * Lo llaman los casos de uso después de guardar, nunca el dominio: la entidad solo anota lo que
 * le pasó (`drenarEventos`), así que un cambio que no llegó a persistirse tampoco se anuncia.
 *
 * Los observadores no se estorban: se esperan con `allSettled` y un fallo solo deja un registro
 * en el log. Avisar importa, pero no más que la operación que ya ocurrió.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Solicitud } from '../../domain/entities/solicitud.entity';
import {
  EventoCambioEstado,
  OBSERVADORES_SOLICITUD,
  ObservadorSolicitud,
} from '../../domain/events/evento-solicitud';

@Injectable()
export class PublicadorEventosSolicitud {
  private readonly logger = new Logger(PublicadorEventosSolicitud.name);

  constructor(
    @Inject(OBSERVADORES_SOLICITUD)
    private readonly observadores: readonly ObservadorSolicitud[],
  ) {}

  /** Vacía los eventos de la solicitud y se los pasa a cada observador. */
  async publicarDe(solicitud: Solicitud): Promise<void> {
    for (const evento of solicitud.drenarEventos()) {
      await this.publicar(evento);
    }
  }

  private async publicar(evento: EventoCambioEstado): Promise<void> {
    const resultados = await Promise.allSettled(this.observadores.map((o) => o.notificar(evento)));

    resultados.forEach((resultado, i) => {
      if (resultado.status === 'rejected') {
        const quien = this.observadores[i].nombre;
        this.logger.error(`El observador "${quien}" falló con ${evento.numero}:`, resultado.reason);
      }
    });
  }
}
