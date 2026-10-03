import { Solicitud } from '../entities/solicitud.entity';
import { NombreEstado } from '../enums/solicitud.enums';

export const SOLICITUD_REPOSITORIO = Symbol('SolicitudRepositorio');

export interface SolicitudRepositorio {
  buscarPorId(id: string): Promise<Solicitud | null>;

  /** US-015: las del estudiante, las más recientes primero. */
  buscarPorEstudiante(estudianteId: string): Promise<Solicitud[]>;

  /** US-012, criterio 2: la solicitud activa (no rechazada) de ese estudiante en esa convocatoria. */
  buscarActiva(estudianteId: string, convocatoriaId: string): Promise<Solicitud | null>;

  contarConPrefijoDeNumero(prefijo: string): Promise<number>;

  /** US-018: las de una convocatoria en un estado, por orden de envío. */
  buscarPorConvocatoriaYEstado(convocatoriaId: string, estado: NombreEstado): Promise<Solicitud[]>;

  /** Varias por id. Las que no existan no aparecen. */
  buscarPorIds(ids: readonly string[]): Promise<Solicitud[]>;

  /** Guarda la solicitud con sus documentos y su historial, todo o nada. */
  guardar(solicitud: Solicitud): Promise<void>;
}
