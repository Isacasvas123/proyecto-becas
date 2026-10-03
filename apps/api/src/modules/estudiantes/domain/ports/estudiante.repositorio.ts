import { Estudiante } from '../entities/estudiante.entity';

export const ESTUDIANTE_REPOSITORIO = Symbol('EstudianteRepositorio');

export interface EstudianteRepositorio {
  /** `null` si la persona todavía no ha empezado su perfil. */
  buscarPorUsuario(usuarioId: string): Promise<Estudiante | null>;

  /** Varios a la vez (reportes). Los que no tengan perfil no aparecen. */
  buscarPorUsuarios(usuarioIds: readonly string[]): Promise<Estudiante[]>;

  /** Crea el perfil o reemplaza el existente. */
  guardar(estudiante: Estudiante): Promise<void>;
}
