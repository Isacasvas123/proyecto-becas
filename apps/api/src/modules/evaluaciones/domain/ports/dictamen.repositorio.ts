import { Dictamen } from '../entities/dictamen.entity';

export const DICTAMEN_REPOSITORIO = Symbol('DictamenRepositorio');

/**
 * Solo se crean y se leen. No hay `actualizar` ni `eliminar`, a propósito (US-019, criterio 4, y el
 * NFR de trazabilidad: los registros de auditoría no se modifican desde la aplicación).
 */
export interface DictamenRepositorio {
  /** Si el evaluador ya dictaminó esa solicitud, debe lanzar `RecursoDuplicadoError`. */
  crear(dictamen: Dictamen): Promise<void>;
  buscar(solicitudId: string, evaluadorId: string): Promise<Dictamen | null>;
  deSolicitudes(solicitudIds: readonly string[]): Promise<Dictamen[]>;
  deEvaluador(evaluadorId: string): Promise<Dictamen[]>;
}
