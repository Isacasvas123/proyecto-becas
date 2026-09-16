import { Usuario } from '../../domain/entities/usuario.entity';
import { TokenSesion } from '../../domain/ports/generador-token';
import { SesionIniciadaDto } from '../dto/sesion-iniciada.dto';

/**
 * La forma de una sesión iniciada, en un solo lugar.
 *
 * La usan el inicio de sesión (US-002) y el registro (US-001), que termina con la persona ya
 * autenticada. Si cada caso de uso armara el objeto por su cuenta, el día que se agregue un campo
 * uno de los dos se olvidaría y el frontend recibiría dos formas distintas de la misma sesión.
 */
export function aSesionIniciada(usuario: Usuario, token: TokenSesion): SesionIniciadaDto {
  return {
    token: token.valor,
    expiraEn: token.expiraEn.toISOString(),
    usuario: {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario.valor,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}
