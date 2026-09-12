/**
 * CAPA: presentation/guards/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-003 — Autorización por rol.
 *
 * Corre **después** de `AutenticacionGuard`: para cuando llega aquí, la petición ya trae un
 * portador verificado. Son dos preguntas distintas y por eso son dos guards:
 *
 *     autenticación → ¿quién eres?      → 401 si no lo sabemos
 *     autorización  → ¿puedes hacerlo?  → 403 si sabemos quién eres pero no te corresponde
 *
 * POR QUÉ 403 Y NO 404
 *   Un criterio de aceptación de US-003 dice: *"un acceso no autorizado devuelve HTTP 403,
 *   no 404 ni el recurso"*. Devolver 404 escondería la existencia del recurso, lo que suena
 *   más seguro pero confunde al usuario legítimo que se equivocó de cuenta, y no aporta gran
 *   cosa: las rutas son públicas y predecibles de todos modos.
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
