import { AutenticacionFallidaError } from '../../../../shared/exceptions/errores-dominio';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';
import { Usuario } from './usuario.entity';

function crear(overrides: Partial<{ activo: boolean; rol: RolUsuario }> = {}): Usuario {
  return new Usuario({
    id: 'id-1',
    nombreUsuario: NombreUsuario.crear('admin'),
    correo: 'admin@becas.gob.gt',
    hashPassword: '$2b$10$hash',
    rol: overrides.rol ?? RolUsuario.ADMINISTRADOR,
    activo: overrides.activo ?? true,
  });
}

describe('Usuario', () => {
  describe('asegurarPuedeIniciarSesion', () => {
    it('no lanza si la cuenta está activa', () => {
      expect(() => crear({ activo: true }).asegurarPuedeIniciarSesion()).not.toThrow();
    });

    it('lanza si la cuenta está desactivada', () => {
      expect(() => crear({ activo: false }).asegurarPuedeIniciarSesion()).toThrow(
        AutenticacionFallidaError,
      );
    });
  });

  describe('protección del hash', () => {
    // Estas tres pruebas fallan si alguien sustituye el campo privado de JavaScript (`#`)
    // por el `private` de TypeScript, que desaparece al compilar y deja el hash expuesto.
    it('no aparece al enumerar las propiedades de la entidad', () => {
      expect(Object.keys(crear())).not.toContain('hashPassword');
    });

    it('no aparece al serializar la entidad a JSON', () => {
      expect(JSON.stringify(crear())).not.toContain('$2b$10$hash');
    });

    it('el hash solo se obtiene por el método explícito', () => {
      expect(crear().hashAlmacenado()).toBe('$2b$10$hash');
    });
  });

  describe('esAdministrador', () => {
    it.each([
      [RolUsuario.ADMINISTRADOR, true],
      [RolUsuario.EVALUADOR, false],
      [RolUsuario.ESTUDIANTE, false],
    ])('para el rol %s devuelve %s', (rol, esperado) => {
      expect(crear({ rol }).esAdministrador()).toBe(esperado);
    });
  });
});
