/**
 * Prueba del objeto de valor `NombreUsuario`. TypeScript puro: sin framework, sin base de
 * datos, sin red.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { NombreUsuario } from './nombre-usuario.vo';

describe('NombreUsuario', () => {
  describe('normalización', () => {
    it.each([
      ['admin', 'admin'],
      ['ADMIN', 'admin'],
      ['  Admin  ', 'admin'],
      ['AdMiN', 'admin'],
    ])('convierte %s en %s', (entrada, esperado) => {
      expect(NombreUsuario.crear(entrada).valor).toBe(esperado);
    });
  });

  describe('validación de longitud', () => {
    it('rechaza menos de 3 caracteres', () => {
      expect(() => NombreUsuario.crear('ab')).toThrow(ReglaDeNegocioError);
    });

    it('rechaza más de 30 caracteres', () => {
      expect(() => NombreUsuario.crear('a'.repeat(31))).toThrow(ReglaDeNegocioError);
    });

    it('acepta los límites exactos', () => {
      expect(NombreUsuario.crear('abc').valor).toBe('abc');
      expect(NombreUsuario.crear('a'.repeat(30)).valor).toHaveLength(30);
    });

    it('cuenta la longitud después de recortar espacios', () => {
      expect(NombreUsuario.crear('   abc   ').valor).toBe('abc');
    });
  });

  describe('validación de formato', () => {
    it.each(['admin.becas', 'admin_1', 'admin-gt', 'usuario123'])('acepta %s', (entrada) => {
      expect(() => NombreUsuario.crear(entrada)).not.toThrow();
    });

    it.each(['admin becas', 'admin@becas', 'admín', 'admin/1', "admin'--"])(
      'rechaza %s',
      (entrada) => {
        expect(() => NombreUsuario.crear(entrada)).toThrow(ReglaDeNegocioError);
      },
    );
  });

  describe('igualdad por valor', () => {
    it('dos instancias con el mismo contenido son iguales', () => {
      expect(NombreUsuario.crear('admin').equals(NombreUsuario.crear('ADMIN'))).toBe(true);
    });

    it('instancias con contenido distinto no son iguales', () => {
      expect(NombreUsuario.crear('admin').equals(NombreUsuario.crear('otro'))).toBe(false);
    });
  });
});
