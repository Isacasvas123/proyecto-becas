/**
 * Decoradores que marcan las rutas para el control de acceso (US-003).
 *
 * El guard es global y seguro por defecto: toda ruta exige sesión salvo que se marque con
 * `@Publico()`. La alternativa, proteger solo lo que se marque, causa la mayoría de las fugas
 * reales: se agrega un endpoint, se olvida el decorador y queda abierto sin que nadie lo note.
 * Así el olvido produce un 401 visible.
 */
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

export const CLAVE_PUBLICO = 'ruta_publica';
export const CLAVE_ROLES = 'roles_permitidos';

/**
 * Abre una ruta a cualquiera, sin sesión.
 *
 * Úsese solo donde el requisito lo exija de verdad: el inicio de sesión, los diagnósticos y
 * —cuando llegue el Sprint 6— la consulta pública del estado de una beca, que el enunciado
 * pide expresamente sin cuenta por transparencia.
 */
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

/**
 * Restringe una ruta a los roles indicados.
 *
 * `@Roles(RolUsuario.ADMINISTRADOR)` exige además de sesión iniciada que el portador del
 * token tenga ese rol. Sin este decorador basta con estar autenticado.
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(CLAVE_ROLES, roles);

/**
 * Inyecta en el controlador el id de quien hace la petición, que deja `AutenticacionGuard` tras
 * verificar el token. Los controladores lo toman de aquí y no de la URL o el cuerpo: si el id
 * viniera del cliente, bastaría cambiarlo para operar sobre las solicitudes de otra persona. Es
 * el criterio de US-003 "un estudiante solo ve sus propias solicitudes", resuelto en la frontera.
 * Usarlo en una ruta `@Publico()` es un error de programación y falla fuerte.
 */
export const UsuarioActual = createParamDecorator((_dato: unknown, contexto: ExecutionContext) => {
  const peticion = contexto.switchToHttp().getRequest<{ portador?: { usuarioId: string } }>();

  if (peticion.portador === undefined) {
    throw new Error('@UsuarioActual() se usó en una ruta sin sesión verificada');
  }

  return peticion.portador.usuarioId;
});
