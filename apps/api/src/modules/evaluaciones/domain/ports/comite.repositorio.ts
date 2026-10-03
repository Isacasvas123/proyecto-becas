import { Asignacion, Comite } from '../entities/comite.entity';

export const COMITE_REPOSITORIO = Symbol('ComiteRepositorio');

/** Comités y sus asignaciones. Van juntos: una asignación no existe fuera de su comité. */
export interface ComiteRepositorio {
  buscarPorId(id: string): Promise<Comite | null>;
  buscarPorConvocatoria(convocatoriaId: string): Promise<Comite | null>;
  listar(): Promise<Comite[]>;

  /**
   * Crea o actualiza el comité y sus integrantes. Si ya hay otro comité para la misma
   * convocatoria, el adaptador DEBE lanzar `RecursoDuplicadoError` (CU-13, 3a).
   */
  guardar(comite: Comite): Promise<void>;

  /** Guarda asignaciones nuevas. Las que ya existían (misma solicitud y evaluador) se ignoran. */
  guardarAsignaciones(asignaciones: readonly Asignacion[]): Promise<void>;
  asignacionesDeComite(comiteId: string): Promise<Asignacion[]>;
  asignacionesDeEvaluador(evaluadorId: string): Promise<Asignacion[]>;
  estaAsignada(solicitudId: string, evaluadorId: string): Promise<boolean>;
}
