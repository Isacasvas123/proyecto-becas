/** Lo que sale de la bitácora hacia la pantalla. Identificadores, nunca datos personales. */
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';

export interface RegistroBitacoraDto {
  /** El nombre de usuario, no el nombre completo: la bitácora no es un directorio de personas. */
  readonly actor: string | null;
  readonly rol: RolUsuario | null;
  readonly accion: string;
  readonly entidad: string | null;
  readonly entidadId: string | null;
  readonly resultado: number;
  readonly rechazada: boolean;
  readonly origen: string | null;
  readonly ocurridoEn: string;
}

export interface PaginaBitacoraDto {
  readonly registros: readonly RegistroBitacoraDto[];
  readonly total: number;
  readonly pagina: number;
  readonly porPagina: number;
  readonly paginas: number;
}
