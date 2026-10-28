/**
 * CAPA: application/services/  ·  el SUJETO del patrón Observer
 * ────────────────────────────────────────────────────────────────────────────────
 * Entrega cada cambio de estado a todos los observadores registrados.
 *
 * QUIÉN LLAMA A ESTO
 *   Los casos de uso, **después** de guardar. Nunca el dominio: la entidad solo anota lo que le
 *   pasó (`drenarEventos`), y así un cambio que no llegó a persistirse tampoco se anuncia.
 *
 * LOS OBSERVADORES NO SE CONOCEN ENTRE SÍ NI PUEDEN ESTORBARSE
 *   Si uno falla, los demás siguen. Por eso se esperan todos con `allSettled` y un fallo solo
 *   deja un registro en el log: avisar es importante, pero no más que la operación que ya ocurrió.
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
