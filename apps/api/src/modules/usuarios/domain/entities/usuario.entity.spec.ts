import { AutenticacionFallidaError } from '../../../../shared/exceptions/errores-dominio';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';
import { MAX_INTENTOS_FALLIDOS, MINUTOS_DE_BLOQUEO, Usuario } from './usuario.entity';

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
  describe('bloqueo tras intentos fallidos (US-002, criterio 3)', () => {
    const AHORA = new Date('2026-09-12T15:00:00.000Z');
    const minutos = (m: number) => new Date(AHORA.getTime() + m * 60 * 1000);

    function fallar(usuario: Usuario, veces: number, cuando = AHORA): Usuario {
      let actual = usuario;
      for (let i = 0; i < veces; i++) {
        actual = actual.conIntentoFallido(cuando);
      }
      return actual;
    }

    it('la política es la del criterio de aceptación: 5 intentos y 15 minutos', () => {
      // Si alguien cambia estas constantes, esta prueba obliga a ir al backlog primero.
      expect(MAX_INTENTOS_FALLIDOS).toBe(5);
      expect(MINUTOS_DE_BLOQUEO).toBe(15);
    });

    it('una cuenta nueva no está bloqueada y no tiene intentos', () => {
      const usuario = crear();

      expect(usuario.estaBloqueado(AHORA)).toBe(false);
      expect(usuario.intentosFallidos).toBe(0);
      expect(usuario.tieneIntentosRegistrados()).toBe(false);
    });

    it('cuatro intentos fallidos NO bloquean', () => {
      const usuario = fallar(crear(), 4);

      expect(usuario.intentosFallidos).toBe(4);
      expect(usuario.estaBloqueado(AHORA)).toBe(false);
    });

    it('el quinto intento fallido bloquea la cuenta', () => {
      const usuario = fallar(crear(), 5);

      expect(usuario.estaBloqueado(AHORA)).toBe(true);
    });

    it('el bloqueo dura exactamente 15 minutos', () => {
      const usuario = fallar(crear(), 5);

      expect(usuario.estaBloqueado(minutos(14))).toBe(true);
      expect(usuario.estaBloqueado(minutos(15))).toBe(false);
      expect(usuario.estaBloqueado(minutos(16))).toBe(false);
    });

    it('al bloquearse, el contador vuelve a cero', () => {
      // Si no volviera a cero, al caducar el bloqueo UN solo fallo más la volvería a bloquear,
      // y el criterio dice cinco intentos, no uno.
      const bloqueado = fallar(crear(), 5);
      expect(bloqueado.intentosFallidos).toBe(0);

      const trasCaducar = bloqueado.conIntentoFallido(minutos(20));
      expect(trasCaducar.estaBloqueado(minutos(20))).toBe(false);
      expect(trasCaducar.intentosFallidos).toBe(1);
    });

    it('un acceso correcto limpia el contador y el bloqueo', () => {
      const limpio = fallar(crear(), 3).conAccesoCorrecto();

      expect(limpio.intentosFallidos).toBe(0);
      expect(limpio.bloqueadoHasta).toBeNull();
      expect(limpio.tieneIntentosRegistrados()).toBe(false);
    });

    it('la entidad es inmutable: registrar un intento no modifica la original', () => {
      const original = crear();

      original.conIntentoFallido(AHORA);

      expect(original.intentosFallidos).toBe(0);
    });

    it('las copias conservan el hash, el rol y el resto de los datos', () => {
      // El hash vive en un campo # que no se puede desestructurar. Si `copiar` lo perdiera, el
      // usuario quedaría sin contraseña tras su primer intento fallido.
      const original = crear({ rol: RolUsuario.EVALUADOR });

      const copia = fallar(original, 5);

      expect(copia.hashAlmacenado()).toBe(original.hashAlmacenado());
      expect(copia.rol).toBe(RolUsuario.EVALUADOR);
      expect(copia.id).toBe(original.id);
      expect(copia.nombreUsuario.equals(original.nombreUsuario)).toBe(true);
      expect(JSON.stringify(copia)).not.toContain('$2b$');
    });
  });
});
