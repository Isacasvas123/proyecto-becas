/**
 * PRUEBAS DE LA CAPA DE DOMINIO.
 *
 * Fíjense en lo que NO aparece en este archivo: ni `Test.createTestingModule`, ni Prisma,
 * ni Docker, ni HTTP. Se instancia la entidad y se le pregunta. Corren en milisegundos.
 *
 * Que esto sea posible es la prueba concreta de que el dominio quedó libre de
 * infraestructura, que es el objetivo central del diseño (docs/05-arquitectura.md §2.2).
 */
import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { EstadoConvocatoria } from '../enums/estado-convocatoria.enum';
import { Requisito } from '../enums/requisito.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
import { TipoDocumento } from '../enums/tipo-documento.enum';
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
    montoBeca: 5000,
    periodo: PeriodoPostulacion.crear(
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-10-31T23:59:59.000Z'),
    ),
    requisitos: [Requisito.NACIONALIDAD_GUATEMALTECA, Requisito.PROMEDIO_MINIMO_75],
    documentosExigidos: [TipoDocumento.DPI, TipoDocumento.CERTIFICADO_NOTAS],
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

  describe('nuevaEnBorrador (US-006, criterio 4)', () => {
    it('una convocatoria nueva nace SIEMPRE en BORRADOR y no es visible al público', () => {
      const { estado: _ignorado, ...sinEstado } = atributos();

      const nueva = Convocatoria.nuevaEnBorrador(sinEstado);

      expect(nueva.estado).toBe(EstadoConvocatoria.BORRADOR);
      expect(nueva.esVisiblePublicamente(AHORA)).toBe(false);
    });
  });

  describe('requisitos y documentos', () => {
    it('elimina repetidos', () => {
      const convocatoria = Convocatoria.reconstituir(
        atributos({
          requisitos: [Requisito.PROMEDIO_MINIMO_80, Requisito.PROMEDIO_MINIMO_80],
          documentosExigidos: [TipoDocumento.DPI, TipoDocumento.DPI],
        }),
      );

      expect(convocatoria.requisitos).toEqual([Requisito.PROMEDIO_MINIMO_80]);
      expect(convocatoria.documentosExigidos).toEqual([TipoDocumento.DPI]);
    });

    it('no se pueden modificar desde fuera de la entidad', () => {
      // Sin esto, cualquiera con la entidad podría cambiarle los requisitos a una convocatoria
      // ya publicada saltándose US-007, criterio 3.
      const convocatoria = Convocatoria.reconstituir(atributos());

      expect(() =>
        (convocatoria.requisitos as Requisito[]).push(Requisito.TITULO_UNIVERSITARIO),
      ).toThrow();
    });

    it('tampoco la modifica quien conserve el arreglo original que se pasó al construirla', () => {
      const requisitos = [Requisito.PROMEDIO_MINIMO_70];
      const convocatoria = Convocatoria.reconstituir(atributos({ requisitos }));

      requisitos.push(Requisito.CARTA_RECOMENDACION);

      expect(convocatoria.requisitos).toEqual([Requisito.PROMEDIO_MINIMO_70]);
    });
  });

  describe('publicar (US-007)', () => {
    const borrador = (cambios: Partial<AtributosConvocatoria> = {}) =>
      Convocatoria.reconstituir(atributos({ estado: EstadoConvocatoria.BORRADOR, ...cambios }));

    it('un borrador con requisitos y documentos pasa a PUBLICADA', () => {
      const convocatoria = borrador();

      convocatoria.publicar();

      expect(convocatoria.estado).toBe(EstadoConvocatoria.PUBLICADA);
    });

    it('al publicarse aparece en el listado público (criterio 2)', () => {
      const convocatoria = borrador();
      expect(convocatoria.esVisiblePublicamente(AHORA)).toBe(false);

      convocatoria.publicar();

      expect(convocatoria.esVisiblePublicamente(AHORA)).toBe(true);
    });

    it('sin requisitos no se publica (criterio 1) y sigue en borrador', () => {
      const convocatoria = borrador({ requisitos: [] });

      expect(() => convocatoria.publicar()).toThrow(ReglaDeNegocioError);
      expect(convocatoria.estado).toBe(EstadoConvocatoria.BORRADOR);
    });

    it('sin documentos exigidos no se publica (criterio 1)', () => {
      const convocatoria = borrador({ documentosExigidos: [] });

      expect(() => convocatoria.publicar()).toThrow(ReglaDeNegocioError);
    });

    it.each([EstadoConvocatoria.PUBLICADA, EstadoConvocatoria.CERRADA])(
      'publicar una convocatoria %s es una transición inválida, no una regla de negocio',
      (estado) => {
        // El tipo de error importa: se traduce a 409 y no a 422, y le dice a la interfaz que el
        // problema es el estado, no los datos.
        const convocatoria = Convocatoria.reconstituir(atributos({ estado }));

        expect(() => convocatoria.publicar()).toThrow(TransicionInvalidaError);
      },
    );
  });

  describe('admiteEdicion (US-007, criterio 3)', () => {
    it.each([
      [EstadoConvocatoria.BORRADOR, true],
      [EstadoConvocatoria.PUBLICADA, false],
      [EstadoConvocatoria.CERRADA, false],
    ])('en %s → %s', (estado, esperado) => {
      expect(Convocatoria.reconstituir(atributos({ estado })).admiteEdicion()).toBe(esperado);
    });

    it('deja de admitir edición en el momento en que se publica', () => {
      const convocatoria = Convocatoria.reconstituir(
        atributos({ estado: EstadoConvocatoria.BORRADOR }),
      );

      convocatoria.publicar();

      expect(convocatoria.admiteEdicion()).toBe(false);
    });
  });
});
