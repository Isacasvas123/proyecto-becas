/**
 * Bandeja de avisos en memoria, para pruebas. Permite comprobar que cada cambio de estado
 * genera su notificación sin levantar PostgreSQL.
 */
import { randomUUID } from 'node:crypto';

import {
  NotificacionGuardada,
  NotificacionRepositorio,
  NuevaNotificacion,
} from '../../domain/ports/notificacion.repositorio';

export class NotificacionEnMemoriaRepositorio implements NotificacionRepositorio {
  private readonly avisos: NotificacionGuardada[] = [];

  crear(n: NuevaNotificacion): Promise<void> {
    this.avisos.push({ ...n, id: randomUUID(), leida: false });
    return Promise.resolve();
  }

  listar(estudianteId: string, maximo: number): Promise<NotificacionGuardada[]> {
    return Promise.resolve(
      this.avisos
        .filter((a) => a.estudianteId === estudianteId)
        .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime())
        .slice(0, maximo),
    );
  }

  contarSinLeer(estudianteId: string): Promise<number> {
    return Promise.resolve(
      this.avisos.filter((a) => a.estudianteId === estudianteId && !a.leida).length,
    );
  }

  marcarLeida(id: string, estudianteId: string): Promise<boolean> {
    const i = this.avisos.findIndex((a) => a.id === id && a.estudianteId === estudianteId);
    if (i === -1) return Promise.resolve(false);
    this.avisos[i] = { ...this.avisos[i], leida: true };
    return Promise.resolve(true);
  }

  marcarTodasLeidas(estudianteId: string): Promise<number> {
    let marcadas = 0;
    this.avisos.forEach((a, i) => {
      if (a.estudianteId === estudianteId && !a.leida) {
        this.avisos[i] = { ...a, leida: true };
        marcadas += 1;
      }
    });
    return Promise.resolve(marcadas);
  }
}
