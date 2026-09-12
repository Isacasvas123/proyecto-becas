/**
 * PRUEBAS DE LA CAPA DE DOMINIO.
 *
 * Fíjense en lo que NO aparece en este archivo: ni `Test.createTestingModule`, ni Prisma,
 * ni Docker, ni HTTP. Se instancia la entidad y se le pregunta. Corren en milisegundos.
 *
 * Que esto sea posible es la prueba concreta de que el dominio quedó libre de
 * infraestructura, que es el objetivo central del diseño (docs/05-arquitectura.md §2.2).
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { EstadoConvocatoria } from '../enums/estado-convocatoria.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
import { PeriodoPostulacion } from '../value-objects/periodo-postulacion.vo';
import { AtributosConvocatoria, Convocatoria } from './convocatoria.entity';

const AHORA = new Date('2026-09-15T12:00:00.000Z');

function atributos(cambios: Partial<AtributosConvocatoria> = {}): AtributosConvocatoria {
  return {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    codigo: 'CONV-2026-001',
    titulo: 'Beca Universitaria Nacional 2026',
    descripcion: 'Apoyo económico para estudiantes de licenciatura.',
    tipo: TipoBeca.UNIVERSITARIA,
    estado: EstadoConvocatoria.PUBLICADA,
    cupos: 500,
    periodo: PeriodoPostulacion.crear(
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-10-31T23:59:59.000Z'),
    ),
    ...cambios,
  };
}

describe('Convocatoria (entidad de dominio)', () => {
  describe('reconstituir', () => {
    it('construye una convocatoria válida con todos sus atributos', () => {
      const convocatoria = Convocatoria.reconstituir(atributos());

      expect(convocatoria.codigo).toBe('CONV-2026-001');
      expect(convocatoria.tipo).toBe(TipoBeca.UNIVERSITARIA);
      expect(convocatoria.estado).toBe(EstadoConvocatoria.PUBLICADA);
      expect(convocatoria.cupos).toBe(500);
    });

    it('rechaza una convocatoria sin código', () => {
      expect(() => Convocatoria.reconstituir(atributos({ codigo: '   ' }))).toThrow(
        ReglaDeNegocioError,
      );
    });

    it('rechaza una convocatoria sin título', () => {
      expect(() => Convocatoria.reconstituir(atributos({ titulo: '' }))).toThrow(
        ReglaDeNegocioError,
      );
    });

    // US-006: "El número de cupos debe ser un entero mayor que cero."
    it.each([0, -1, 3.5])('rechaza %p como número de cupos', (cupos) => {
      expect(() => Convocatoria.reconstituir(atributos({ cupos }))).toThrow(ReglaDeNegocioError);
    });
  });

  describe('esVisiblePublicamente (regla de US-008)', () => {
    it('es visible si está PUBLICADA y la fecha de cierre no ha pasado', () => {
      const convocatoria = Convocatoria.reconstituir(atributos());

      expect(convocatoria.esVisiblePublicamente(AHORA)).toBe(true);
    });

    it('NO es visible si está en BORRADOR, aunque esté dentro del periodo', () => {
      const convocatoria = Convocatoria.reconstituir(
        atributos({ estado: EstadoConvocatoria.BORRADOR }),
      );

      expect(convocatoria.esVisiblePublicamente(AHORA)).toBe(false);
    });

    it('NO es visible si está CERRADA', () => {
      const convocatoria = Convocatoria.reconstituir(
        atributos({ estado: EstadoConvocatoria.CERRADA }),
      );

      expect(convocatoria.esVisiblePublicamente(AHORA)).toBe(false);
    });

    it('NO es visible si ya venció la fecha de cierre', () => {
      const convocatoria = Convocatoria.reconstituir(atributos());
      const despuesDelCierre = new Date('2026-11-01T00:00:00.000Z');

      expect(convocatoria.esVisiblePublicamente(despuesDelCierre)).toBe(false);
    });
  });

  describe('admiteSolicitudes', () => {
    it('admite solicitudes dentro del periodo si está PUBLICADA', () => {
      const convocatoria = Convocatoria.reconstituir(atributos());

      expect(convocatoria.admiteSolicitudes(AHORA)).toBe(true);
    });

    it('no admite solicitudes antes de la fecha de apertura', () => {
      const convocatoria = Convocatoria.reconstituir(atributos());
      const antesDeAbrir = new Date('2026-08-15T00:00:00.000Z');

      expect(convocatoria.admiteSolicitudes(antesDeAbrir)).toBe(false);
    });
  });
});
