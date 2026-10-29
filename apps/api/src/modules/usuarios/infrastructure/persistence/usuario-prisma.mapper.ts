/**
 * Traduce entre el modelo de persistencia (fila de Prisma) y el de dominio (entidad `Usuario`).
 * Es el precio de mantener el dominio libre del ORM (trade-off nº3 de docs/05-arquitectura.md
 * §2.2). Es el único punto del módulo donde conviven los tipos de Prisma y los del dominio, y por
 * eso el único donde puede colarse un desajuste entre los enums de rol; lo vigila
 * `usuario-prisma.mapper.spec.ts`.
 */
import type { Usuario as UsuarioPrisma } from '@prisma/client';

import { Usuario } from '../../domain/entities/usuario.entity';
import { ROLES_PERSISTIBLES, RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';

export function aDominio(fila: UsuarioPrisma): Usuario {
  return new Usuario({
    id: fila.id,
    nombreUsuario: NombreUsuario.crear(fila.nombreUsuario),
    correo: fila.correo,
    hashPassword: fila.hashPassword,
    rol: aRolDominio(fila.rol),
    activo: fila.activo,
    intentosFallidos: fila.intentosFallidos,
    bloqueadoHasta: fila.bloqueadoHasta,
    nombreCompleto: fila.nombreCompleto,
    cui: fila.cui === null ? null : Cui.crear(fila.cui),
  });
}

/**
 * Convierte el rol de Prisma al enum del dominio.
 *
 * Si alguien agregara un rol en el `schema.prisma` sin agregarlo aquí, esta función
 * lanzaría en tiempo de ejecución. La prueba del mapper compara ambos conjuntos de
 * valores para que ese error salte antes, en CI.
 */
function aRolDominio(rol: UsuarioPrisma['rol']): RolUsuario {
  const equivalente = RolUsuario[rol as keyof typeof RolUsuario];

  if (equivalente === undefined) {
    throw new Error(
      `El rol "${rol}" existe en el esquema de Prisma pero no en RolUsuario del dominio`,
    );
  }

  return equivalente;
}

/**
 * Del rol del dominio al de Prisma. `PUBLICO` no se persiste —es el visitante sin sesión—, así
 * que intentar guardarlo es un error de programación y falla fuerte en vez de colarse.
 */
export function aRolPersistible(rol: RolUsuario): UsuarioPrisma['rol'] {
  if (!ROLES_PERSISTIBLES.includes(rol)) {
    throw new Error(`El rol ${rol} no se puede guardar en la base de datos`);
  }
  return rol as UsuarioPrisma['rol'];
}
