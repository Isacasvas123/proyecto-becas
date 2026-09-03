/**
 * CAPA: application/dto/
 * ────────────────────────────────────────────────────────────────────────────────
 * Resultado del caso de uso "iniciar sesión".
 *
 * OBSÉRVESE QUÉ NO ESTÁ AQUÍ: el hash de la contraseña. Ni siquiera un campo opcional.
 * La entidad `Usuario` nunca cruza esta frontera, así que es estructuralmente imposible
 * que el hash llegue a la respuesta HTTP aunque alguien se descuide.
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
