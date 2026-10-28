/**
 * US-003: autorización por rol. Corre después de `AutenticacionGuard`, cuando la petición ya trae
 * un portador verificado. Son dos preguntas y por eso dos guards:
 *
 *     autenticación → ¿quién eres?      → 401 si no lo sabemos
 *     autorización  → ¿puedes hacerlo?  → 403 si lo sabemos pero no te corresponde
 *
 * Es 403 y no 404 porque un criterio de US-003 dice que un acceso no autorizado devuelve 403, no
 * 404 ni el recurso. El 404 escondería la existencia del recurso, pero confunde al usuario
 * legítimo y aporta poco: las rutas son públicas y predecibles.
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { PeticionAutenticada } from './autenticacion.guard';
import { CLAVE_ROLES } from './decoradores';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesExigidos = this.reflector.getAllAndOverride<RolUsuario[]>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    // Sin `@Roles(...)` basta con estar autenticado. La restricción por rol es opcional y
    // se declara donde hace falta.
    if (rolesExigidos === undefined || rolesExigidos.length === 0) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<PeticionAutenticada>();
    const portador = peticion.portador;

    // Si no hay portador es que alguien puso `@Roles` en una ruta marcada `@Publico`. Es un
    // error de programación, no un intento de acceso: se rechaza y se registra fuerte.
    if (portador === undefined) {
      this.logger.error(
        `La ruta ${peticion.method} ${peticion.url} exige rol pero no pasó por autenticación. ` +
          '¿Se combinó @Roles con @Publico?',
      );
      throw new ForbiddenException('No tiene permiso para realizar esta acción');
    }

    if (!rolesExigidos.includes(portador.rol as RolUsuario)) {
      this.logger.warn(
        `${portador.nombreUsuario} (${portador.rol}) intentó acceder a ` +
          `${peticion.method} ${peticion.url}, que exige ${rolesExigidos.join(' o ')}`,
      );
      throw new ForbiddenException('No tiene permiso para realizar esta acción');
    }

    return true;
  }
}
