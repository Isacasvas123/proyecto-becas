/**
 * El dominio declara su propio `RolUsuario` para no importar Prisma, y el precio es que hay dos
 * listas de roles que deben coincidir. Si alguien agrega un rol al `schema.prisma` y olvida el
 * enum del dominio, el desajuste explotaría en ejecución la primera vez que un usuario con ese
 * rol iniciara sesión. Aquí se comparan ambos conjuntos para que falle en CI. Es la mitigación
 * del punto débil señalado en `rol-usuario.enum.ts`.
 */
import { RolUsuario as RolPrisma } from '@prisma/client';

import { ROLES_PERSISTIBLES, RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { aDominio } from './usuario-prisma.mapper';

describe('usuario-prisma.mapper', () => {
  it('los roles persistibles del dominio y los de Prisma coinciden exactamente', () => {
    const persistiblesEnDominio = [...ROLES_PERSISTIBLES].sort();
    const enPrisma = Object.values(RolPrisma).sort();

    expect(persistiblesEnDominio).toEqual(enPrisma);
  });

  it('PUBLICO existe en el dominio y sigue fuera de Prisma', () => {
    // US-003 exige cuatro roles, pero `PUBLICO` es el visitante sin sesión: no hay filas de
    // `Usuario` con ese rol y no debe poder haberlas. La diferencia entre los dos enums es
    // intencional y esta prueba la fija, para que nadie la "arregle" agregándolo al schema.
    expect(Object.values(RolUsuario)).toContain('PUBLICO');
    expect(Object.values(RolPrisma)).not.toContain('PUBLICO');
    expect(ROLES_PERSISTIBLES).not.toContain(RolUsuario.PUBLICO);
  });

  it('no se olvidó ningún rol: dominio = persistibles + PUBLICO', () => {
    // Red de seguridad para un rol futuro: si alguien agrega uno al dominio y olvida
    // decidir si se persiste, esta prueba se pone roja y lo obliga a decidirlo.
    expect(Object.values(RolUsuario).sort()).toEqual(
      [...ROLES_PERSISTIBLES, RolUsuario.PUBLICO].sort(),
    );
  });

  it('traduce una fila de Prisma a la entidad de dominio', () => {
    const usuario = aDominio({
      id: 'id-1',
      nombreUsuario: 'admin',
      correo: 'admin@becas.gob.gt',
      hashPassword: '$2b$10$hash',
      rol: RolPrisma.ADMINISTRADOR,
      activo: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
      nombreCompleto: null,
      cui: null,
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
      intentosFallidos: 0,
      bloqueadoHasta: null,
      nombreCompleto: null,
      cui: null,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });

    expect(usuario.nombreUsuario.valor).toBe('admin');
  });

  it('traduce el estado del bloqueo por intentos fallidos (US-002)', () => {
    // Si el mapper olvidara estos dos campos, la cuenta se "desbloquearía" en cada lectura de
    // la base y el criterio 3 de US-002 no funcionaría en producción aunque todas las pruebas
    // del dominio pasaran. Es exactamente el hueco entre capas que esta prueba cierra.
    const bloqueadoHasta = new Date('2026-09-12T15:15:00.000Z');

    const usuario = aDominio({
      id: 'id-3',
      nombreUsuario: 'ana',
      correo: 'ana@becas.gob.gt',
      hashPassword: '$2b$10$hash',
      rol: RolPrisma.ESTUDIANTE,
      activo: true,
      intentosFallidos: 3,
      bloqueadoHasta,
      nombreCompleto: 'Ana López',
      cui: '2456789010101',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });

    expect(usuario.intentosFallidos).toBe(3);
    expect(usuario.bloqueadoHasta).toEqual(bloqueadoHasta);
    expect(usuario.estaBloqueado(new Date('2026-09-12T15:00:00.000Z'))).toBe(true);
  });

  it('traduce la identidad de la persona (US-001)', () => {
    const usuario = aDominio({
      id: 'id-4',
      nombreUsuario: 'ana',
      correo: 'ana@becas.gob.gt',
      hashPassword: '$2b$10$hash',
      rol: RolPrisma.ESTUDIANTE,
      activo: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
      nombreCompleto: 'Ana López',
      cui: '2456789010101',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });

    expect(usuario.nombreCompleto).toBe('Ana López');
    expect(usuario.cui?.valor).toBe('2456789010101');
  });
});
