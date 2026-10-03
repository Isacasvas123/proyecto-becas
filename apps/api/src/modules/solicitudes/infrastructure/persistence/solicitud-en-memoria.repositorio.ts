import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { SolicitudRepositorio } from '../../domain/ports/solicitud.repositorio';

/** Doble para pruebas: mismo contrato que el adaptador de Prisma. */
export class SolicitudEnMemoriaRepositorio implements SolicitudRepositorio {
  private readonly solicitudes = new Map<string, Solicitud>();

  constructor(iniciales: Solicitud[] = []) {
    iniciales.forEach((s) => this.solicitudes.set(s.id, s));
  }

  buscarPorId(id: string): Promise<Solicitud | null> {
    return Promise.resolve(this.solicitudes.get(id) ?? null);
  }

  buscarPorEstudiante(estudianteId: string): Promise<Solicitud[]> {
    return Promise.resolve(
      [...this.solicitudes.values()]
        .filter((s) => s.estudianteId === estudianteId)
        .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime()),
    );
  }

  buscarActiva(estudianteId: string, convocatoriaId: string): Promise<Solicitud | null> {
    return Promise.resolve(
      [...this.solicitudes.values()].find(
        (s) =>
          s.estudianteId === estudianteId && s.convocatoriaId === convocatoriaId && s.estaActiva(),
      ) ?? null,
    );
  }

  contarConPrefijoDeNumero(prefijo: string): Promise<number> {
    return Promise.resolve(
      [...this.solicitudes.values()].filter((s) => s.numero.startsWith(prefijo)).length,
    );
  }

  buscarPorConvocatoriaYEstado(convocatoriaId: string, estado: NombreEstado): Promise<Solicitud[]> {
    return Promise.resolve(
      [...this.solicitudes.values()]
        .filter((s) => s.convocatoriaId === convocatoriaId && s.nombreEstado === estado)
        .sort((a, b) => (a.enviadaEn?.getTime() ?? 0) - (b.enviadaEn?.getTime() ?? 0)),
    );
  }

  buscarPorIds(ids: readonly string[]): Promise<Solicitud[]> {
    return Promise.resolve([...this.solicitudes.values()].filter((s) => ids.includes(s.id)));
  }

  guardar(solicitud: Solicitud): Promise<void> {
    this.solicitudes.set(solicitud.id, solicitud);
    return Promise.resolve();
  }
}
