/**
 * CAPA: infrastructure/persistence/
 * ────────────────────────────────────────────────────────────────────────────────
 * La bandeja de avisos en PostgreSQL (US-022).
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import {
  NotificacionGuardada,
  NotificacionRepositorio,
  NuevaNotificacion,
} from '../../domain/ports/notificacion.repositorio';

@Injectable()
export class NotificacionPrismaRepositorio implements NotificacionRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async crear(n: NuevaNotificacion): Promise<void> {
    await this.prisma.notificacion.create({
      data: {
        estudianteId: n.estudianteId,
        solicitudId: n.solicitudId,
        numero: n.numero,
        desde: n.desde,
        hacia: n.hacia,
        mensaje: n.mensaje,
        motivo: n.motivo,
        creadaEn: n.creadaEn,
      },
    });
  }

  async listar(estudianteId: string, maximo: number): Promise<NotificacionGuardada[]> {
    const filas = await this.prisma.notificacion.findMany({
      where: { estudianteId },
      orderBy: { creadaEn: 'desc' },
      take: maximo,
    });

    return filas.map((f) => ({
      id: f.id,
      estudianteId: f.estudianteId,
      solicitudId: f.solicitudId,
      numero: f.numero,
      desde: f.desde as NombreEstado | null,
      hacia: f.hacia as NombreEstado,
      mensaje: f.mensaje,
      motivo: f.motivo,
      leida: f.leida,
      creadaEn: f.creadaEn,
    }));
  }

  contarSinLeer(estudianteId: string): Promise<number> {
    return this.prisma.notificacion.count({ where: { estudianteId, leida: false } });
  }

  /** El `where` incluye al estudiante: pedir la de otro no la marca ni confirma que exista. */
  async marcarLeida(id: string, estudianteId: string): Promise<boolean> {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { id, estudianteId },
      data: { leida: true },
    });
    return count > 0;
  }

  async marcarTodasLeidas(estudianteId: string): Promise<number> {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { estudianteId, leida: false },
      data: { leida: true },
    });
    return count;
  }
}
