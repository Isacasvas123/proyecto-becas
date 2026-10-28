/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * La bandeja del estudiante (US-022; exigida por el PO el 17 de octubre de 2026).
 *
 * Cada estudiante ve **solo las suyas**: el identificador sale del token y nunca de la URL, el
 * mismo criterio de US-003 que impide ver las solicitudes de otro. Por eso el id del estudiante
 * viaja hasta el repositorio en cada operación, incluida la de marcar leído.
 */
import { Inject, Injectable } from '@nestjs/common';

import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import {
  NOTIFICACION_REPOSITORIO,
  NotificacionRepositorio,
} from '../../domain/ports/notificacion.repositorio';

export interface NotificacionDto {
  readonly id: string;
  readonly solicitudId: string;
  readonly numero: string;
  readonly estado: string;
  readonly mensaje: string;
  readonly motivo: string | null;
  readonly leida: boolean;
  readonly creadaEn: string;
}

/** Tope de la bandeja: lo reciente es lo que importa, y evita traerse años de historial. */
const MAXIMO = 50;

@Injectable()
export class NotificacionesService {
  constructor(
    @Inject(NOTIFICACION_REPOSITORIO)
    private readonly repositorio: NotificacionRepositorio,
  ) {}

  async mias(
    estudianteId: string,
  ): Promise<{ sinLeer: number; notificaciones: NotificacionDto[] }> {
    const [guardadas, sinLeer] = await Promise.all([
      this.repositorio.listar(estudianteId, MAXIMO),
      this.repositorio.contarSinLeer(estudianteId),
    ]);

    return {
      sinLeer,
      notificaciones: guardadas.map((n) => ({
        id: n.id,
        solicitudId: n.solicitudId,
        numero: n.numero,
        estado: n.hacia,
        mensaje: n.mensaje,
        motivo: n.motivo,
        leida: n.leida,
        creadaEn: n.creadaEn.toISOString(),
      })),
    };
  }

  async marcarLeida(id: string, estudianteId: string): Promise<void> {
    const encontrada = await this.repositorio.marcarLeida(id, estudianteId);
    if (!encontrada) {
      throw new RecursoNoEncontradoError('No encontramos esa notificación.');
    }
  }

  async marcarTodasLeidas(estudianteId: string): Promise<{ marcadas: number }> {
    return { marcadas: await this.repositorio.marcarTodasLeidas(estudianteId) };
  }
}
