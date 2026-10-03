import { Estudiante } from '../../domain/entities/estudiante.entity';
import { EstudianteRepositorio } from '../../domain/ports/estudiante.repositorio';

/** Doble para pruebas: mismo contrato que el adaptador de Prisma. */
export class EstudianteEnMemoriaRepositorio implements EstudianteRepositorio {
  private readonly perfiles = new Map<string, Estudiante>();

  constructor(iniciales: Estudiante[] = []) {
    for (const perfil of iniciales) {
      this.perfiles.set(perfil.usuarioId, perfil);
    }
  }

  buscarPorUsuario(usuarioId: string): Promise<Estudiante | null> {
    return Promise.resolve(this.perfiles.get(usuarioId) ?? null);
  }

  buscarPorUsuarios(usuarioIds: readonly string[]): Promise<Estudiante[]> {
    return Promise.resolve(
      usuarioIds.map((id) => this.perfiles.get(id)).filter((p): p is Estudiante => p !== undefined),
    );
  }

  guardar(estudiante: Estudiante): Promise<void> {
    this.perfiles.set(estudiante.usuarioId, estudiante);
    return Promise.resolve();
  }
}
