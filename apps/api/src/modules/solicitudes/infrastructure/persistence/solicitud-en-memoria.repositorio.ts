import { Solicitud } from '../../domain/entities/solicitud.entity';
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

  guardar(solicitud: Solicitud): Promise<void> {
    this.solicitudes.set(solicitud.id, solicitud);
    return Promise.resolve();
  }
}
