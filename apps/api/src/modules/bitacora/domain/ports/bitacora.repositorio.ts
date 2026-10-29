/**
 * Puerto de la bitácora. No tiene `actualizar` ni `eliminar`: si existieran, alguien los usaría
 * para "arreglar" un registro y dejaría de ser evidencia. Borrar por retención, si hiciera falta,
 * sería trabajo de administración de la base.
 */
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { RegistroBitacora } from '../entities/registro-bitacora.entity';

export const BITACORA_REPOSITORIO = Symbol('BitacoraRepositorio');

/** Filtros de consulta. Todos opcionales: sin ninguno, la bitácora completa, de lo más reciente. */
export interface FiltroBitacora {
  readonly actorId?: string;
  readonly rol?: RolUsuario;
  readonly entidad?: string;
  readonly desde?: Date;
  readonly hasta?: Date;
  /** Solo las peticiones rechazadas (4xx y 5xx). */
  readonly soloRechazadas?: boolean;
  readonly pagina: number;
  readonly porPagina: number;
}

export interface PaginaBitacora {
  readonly registros: readonly RegistroBitacora[];
  readonly total: number;
}

export interface BitacoraRepositorio {
  registrar(registro: RegistroBitacora): Promise<void>;
  consultar(filtro: FiltroBitacora): Promise<PaginaBitacora>;
  /** Las entidades que aparecen en la bitácora, para llenar el filtro de la pantalla. */
  entidades(): Promise<string[]>;
}
