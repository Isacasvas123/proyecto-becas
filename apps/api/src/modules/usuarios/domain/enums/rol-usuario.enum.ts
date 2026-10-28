/**
 * CAPA: domain/enums/
 * ────────────────────────────────────────────────────────────────────────────────
 * Roles del sistema (US-003).
 *
 * POR QUÉ EL DOMINIO DECLARA SU PROPIO ENUM Y NO IMPORTA EL DE PRISMA
 *   Importar `RolUsuario` de `@prisma/client` metería el ORM dentro de `domain/` y
 *   rompería la regla de dependencia (docs/05-arquitectura.md §2.3). El precio es que
 *   este enum y el del `schema.prisma` deben mantenerse sincronizados a mano; el mapper
 *   de `infrastructure/` hace la traducción, y `usuario-prisma.mapper.spec.ts` verifica
 *   que ambos conjuntos coincidan para que el desajuste falle en las pruebas y no en
 *   producción.
 *
 * POR QUÉ `PUBLICO` ESTÁ AQUÍ Y NO EN EL `schema.prisma`
 *   US-003 exige cuatro roles y `PUBLICO` es uno de ellos, pero es el único que NO se
 *   persiste: representa a quien no ha iniciado sesión, y por definición no existe una fila
 *   de `Usuario` con ese rol. Meterlo en el enum de Prisma permitiría crear un usuario
 *   "público" en la base de datos, que es un estado sin sentido y una fuente de fallos.
 *
 *   Esa diferencia es deliberada, así que `usuario-prisma.mapper.spec.ts` ya no compara los
 *   dos enums en crudo: compara los roles PERSISTIBLES y además exige que `PUBLICO` siga
 *   fuera de Prisma. Un rol nuevo que se olvide en un lado sigue poniendo el CI en rojo.
 *
 *   Señalado por Stuard en la revisión del PR #4: el criterio de aceptación de US-003 lista
 *   cuatro roles y el enum declaraba tres.
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
