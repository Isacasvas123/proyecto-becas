/**
 * Esta prueba existe por una razón concreta y documentada.
 *
 * El dominio declara su propio `RolUsuario` para no importar Prisma (regla de capas), y
 * el precio es que hay DOS listas de roles que deben coincidir. Si alguien agrega un rol
 * al `schema.prisma` y olvida el enum del dominio, el desajuste explotaría en tiempo de
 * ejecución la primera vez que un usuario con ese rol iniciara sesión.
 *
 * Aquí se comparan ambos conjuntos para que ese error falle en CI, no en producción.
 * Es la mitigación del punto débil señalado en `rol-usuario.enum.ts`.
 */
import { RolUsuario as RolPrisma } from '@prisma/client';

import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { aDominio } from './usuario-prisma.mapper';

describe('usuario-prisma.mapper', () => {
  it('el enum del dominio y el de Prisma declaran exactamente los mismos roles', () => {
    const enDominio = Object.values(RolUsuario).sort();
    const enPrisma = Object.values(RolPrisma).sort();

    expect(enDominio).toEqual(enPrisma);
  });

  it('traduce una fila de Prisma a la entidad de dominio', () => {
    const usuario = aDominio({
      id: 'id-1',
      nombreUsuario: 'admin',
      correo: 'admin@becas.gob.gt',
      hashPassword: '$2b$10$hash',
      rol: RolPrisma.ADMINISTRADOR,
      activo: true,
      creadoEn: new Date('2026-09-01T00:00:00.000Z'),
      actualizadoEn: new Date('2026-09-01T00:00:00.000Z'),
    });

    expect(usuario.id).toBe('id-1');
    expect(usuario.nombreUsuario.valor).toBe('admin');
    expect(usuario.rol).toBe(RolUsuario.ADMINISTRADOR);
    expect(usuario.esAdministrador()).toBe(true);
    expect(usuario.hashAlmacenado()).toBe('$2b$10$hash');
  });

  it('normaliza el nombre de usuario que venga con mayúsculas en la base de datos', () => {
    const usuario = aDominio({
      id: 'id-2',
      nombreUsuario: 'ADMIN',
      correo: 'admin@becas.gob.gt',
      hashPassword: '$2b$10$hash',
      rol: RolPrisma.ESTUDIANTE,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });

    expect(usuario.nombreUsuario.valor).toBe('admin');
  });
});
