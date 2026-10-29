/**
 * Resultado de iniciar sesión. No incluye el hash de la contraseña, ni siquiera como campo
 * opcional: la entidad `Usuario` nunca cruza esta frontera, así que el hash no puede llegar a la
 * respuesta HTTP por descuido.
 */
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

export interface SesionIniciadaDto {
  readonly token: string;
  readonly expiraEn: string;
  readonly usuario: {
    readonly id: string;
    readonly nombreUsuario: string;
    readonly correo: string;
    readonly rol: RolUsuario;
  };
}
