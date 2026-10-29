/**
 * Roles del sistema (US-003).
 *
 * El dominio declara su propio enum y no importa el de Prisma: hacerlo metería el ORM en
 * `domain/` y rompería la regla de dependencia (docs/05-arquitectura.md §2.3). El precio es
 * mantenerlos sincronizados; el mapper hace la traducción y `usuario-prisma.mapper.spec.ts`
 * verifica que coincidan, para que el desajuste falle en las pruebas y no en producción.
 *
 * `PUBLICO` está aquí y no en `schema.prisma` porque es el único rol que no se persiste:
 * representa a quien no ha iniciado sesión y no existe una fila de `Usuario` con ese rol. Esa
 * diferencia es deliberada, así que la prueba compara los roles persistibles y exige que
 * `PUBLICO` siga fuera de Prisma. Lo señaló Stuard en la revisión del PR #4: el criterio de US-003
 * lista cuatro roles y el enum declaraba tres.
 */
export enum RolUsuario {
  ESTUDIANTE = 'ESTUDIANTE',
  EVALUADOR = 'EVALUADOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
  /** Visitante sin sesión. No se persiste: ver la nota de arriba. */
  PUBLICO = 'PUBLICO',
}

/**
 * Los roles que SÍ pueden estar guardados en la base de datos.
 *
 * Es la lista que debe coincidir con el enum de Prisma, y la que deben usar las validaciones
 * de registro y de cambio de rol: nadie puede quedar registrado como `PUBLICO`.
 */
export const ROLES_PERSISTIBLES: readonly RolUsuario[] = [
  RolUsuario.ESTUDIANTE,
  RolUsuario.EVALUADOR,
  RolUsuario.ADMINISTRADOR,
] as const;
