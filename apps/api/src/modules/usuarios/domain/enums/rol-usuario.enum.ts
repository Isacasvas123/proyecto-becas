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
 * Hoy solo se usa ADMINISTRADOR: el control de acceso por rol es del Sprint 2 (US-003).
 */
export enum RolUsuario {
  ESTUDIANTE = 'ESTUDIANTE',
  EVALUADOR = 'EVALUADOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}
