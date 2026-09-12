/**
 * CAPA: presentation/guards/
 * ────────────────────────────────────────────────────────────────────────────────
 * Decoradores que marcan las rutas para el control de acceso (US-003).
 *
 * DECISIÓN IMPORTANTE — SEGURO POR DEFECTO
 *   El guard se registra de forma **global**: toda ruta exige sesión salvo que se marque
 *   explícitamente con `@Publico()`.
 *
 *   La alternativa —proteger solo lo que se marque— es la que causa la mayoría de las fugas
 *   reales: alguien agrega un endpoint, olvida el decorador, y queda abierto sin que nadie
 *   lo note. Con este criterio el olvido produce un 401 molesto pero visible, no una fuga
 *   silenciosa. Se prefiere fallar cerrado.
 */
import { SetMetadata } from '@nestjs/common';

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
