/**
 * CAPA: infrastructure/persistence/
 * ────────────────────────────────────────────────────────────────────────────────
 * Traduce entre el modelo de PERSISTENCIA (fila de Prisma) y el modelo de DOMINIO
 * (entidad `Usuario`). Es el precio aceptado de mantener el dominio libre del ORM
 * (trade-off nº3 de docs/05-arquitectura.md §2.2).
 *
 * Este archivo es el ÚNICO punto del módulo donde conviven los tipos de Prisma y los del
 * dominio. Por eso también es el único donde puede colarse un desajuste entre los dos
 * enums de rol; `usuario-prisma.mapper.spec.ts` lo vigila.
 */
import type { Usuario as UsuarioPrisma } from '@prisma/client';

import { Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';

export function aDominio(fila: UsuarioPrisma): Usuario {
  return new Usuario({
    id: fila.id,
    nombreUsuario: NombreUsuario.crear(fila.nombreUsuario),
    correo: fila.correo,
    hashPassword: fila.hashPassword,
    rol: aRolDominio(fila.rol),
    activo: fila.activo,
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
