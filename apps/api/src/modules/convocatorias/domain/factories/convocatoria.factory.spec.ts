/**
 * Pruebas del patrón Factory Method (docs/06-patrones.md §1). Además de que el código funciona,
 * demuestran que cada tipo de beca trae sus requisitos y documentos (US-006, criterio 1), que la
 * regla propia de un tipo, el tope de posgrado, no contamina a los demás, y que el registro cubre
 * todos los tipos. Agregar un `TipoBeca` sin su fábrica ya falla al compilar; esta prueba lo deja
 * escrito.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { EstadoConvocatoria } from '../enums/estado-convocatoria.enum';
import { Requisito } from '../enums/requisito.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
import { TipoDocumento } from '../enums/tipo-documento.enum';
import {
  ConvocatoriaFactory,
  ConvocatoriaNivelMedioFactory,
  ConvocatoriaPosgradoFactory,
  ConvocatoriaUniversitariaFactory,
  DatosNuevaConvocatoria,
  FABRICAS_CONVOCATORIA,
  MAX_CUPOS_POSGRADO,
  fabricaPara,
} from './convocatoria.factory';

function datos(cambios: Partial<DatosNuevaConvocatoria> = {}): DatosNuevaConvocatoria {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    codigo: 'X-2026-001',
    titulo: 'Convocatoria de prueba',
    descripcion: 'Descripción',
    cupos: 30,
    montoBeca: 5000,
    apertura: new Date('2026-10-01T00:00:00.000Z'),
    cierre: new Date('2026-11-30T00:00:00.000Z'),
    ...cambios,
  };
}

describe('ConvocatoriaFactory (Factory Method)', () => {
  describe('el registro', () => {
    it('tiene una fábrica para CADA tipo de beca, y cada fábrica produce su tipo', () => {
      for (const tipo of Object.values(TipoBeca)) {
        const fabrica = fabricaPara(tipo);

        expect(fabrica).toBeInstanceOf(ConvocatoriaFactory);
        expect(fabrica.tipo()).toBe(tipo);
      }
      expect(Object.keys(FABRICAS_CONVOCATORIA).sort()).toEqual(Object.values(TipoBeca).sort());
    });

    it('los prefijos de código no se repiten entre tipos', () => {
      const prefijos = Object.values(FABRICAS_CONVOCATORIA).map((f) => f.prefijoCodigo());

      expect(new Set(prefijos).size).toBe(prefijos.length);
    });
  });

  describe('el método plantilla crear()', () => {
    it.each([
      [new ConvocatoriaNivelMedioFactory(), TipoBeca.NIVEL_MEDIO],
      [new ConvocatoriaUniversitariaFactory(), TipoBeca.UNIVERSITARIA],
      [new ConvocatoriaPosgradoFactory(), TipoBeca.POSGRADO],
    ])('%s crea una convocatoria de su tipo, en BORRADOR', (fabrica, tipo) => {
      const convocatoria = fabrica.crear(datos());

      expect(convocatoria.tipo).toBe(tipo);
      expect(convocatoria.estado).toBe(EstadoConvocatoria.BORRADOR);
    });

    it('sin requisitos ni documentos indicados, usa los del tipo (US-006, criterio 1)', () => {
      const fabrica = new ConvocatoriaPosgradoFactory();

      const convocatoria = fabrica.crear(datos());

      expect(convocatoria.requisitos).toEqual(fabrica.requisitosPorDefecto());
      expect(convocatoria.documentosExigidos).toEqual(fabrica.documentosPorDefecto());
    });

    it('si el administrador los indica, respeta los suyos y no los del tipo', () => {
      const convocatoria = new ConvocatoriaPosgradoFactory().crear(
        datos({
          requisitos: [Requisito.NACIONALIDAD_GUATEMALTECA],
          documentosExigidos: [TipoDocumento.DPI],
        }),
      );

      expect(convocatoria.requisitos).toEqual([Requisito.NACIONALIDAD_GUATEMALTECA]);
      expect(convocatoria.documentosExigidos).toEqual([TipoDocumento.DPI]);
    });

    it('una lista VACÍA indicada a propósito se respeta: no se rellena con los del tipo', () => {
      // Diferencia sutil pero importante: "no mandé nada" usa los del tipo; "mandé una lista
      // vacía" es una decisión del administrador. Ese borrador existirá, pero no podrá
      // publicarse (US-007, criterio 1).
      const convocatoria = new ConvocatoriaUniversitariaFactory().crear(datos({ requisitos: [] }));

      expect(convocatoria.requisitos).toEqual([]);
    });

    it('la fecha de cierre debe ser posterior a la de apertura (US-006, criterio 2)', () => {
      expect(() =>
        new ConvocatoriaUniversitariaFactory().crear(
          datos({
            apertura: new Date('2026-11-30T00:00:00.000Z'),
            cierre: new Date('2026-10-01T00:00:00.000Z'),
          }),
        ),
      ).toThrow(ReglaDeNegocioError);
    });

    it.each([0, -5, 2.5])('cupos = %s se rechaza (US-006, criterio 3)', (cupos) => {
      expect(() => new ConvocatoriaNivelMedioFactory().crear(datos({ cupos }))).toThrow(
        ReglaDeNegocioError,
      );
    });
  });

  describe('reglas propias de cada tipo', () => {
    it('nivel medio exige certificado de nacimiento y NO DPI', () => {
      // Los aspirantes de nivel medio son en su mayoría menores de edad y el DPI se emite a
      // partir de los 18 años. Exigirlo excluiría a la población que el programa atiende.
      const documentos = new ConvocatoriaNivelMedioFactory().documentosPorDefecto();

      expect(documentos).toContain(TipoDocumento.CERTIFICADO_NACIMIENTO);
      expect(documentos).not.toContain(TipoDocumento.DPI);
    });

    it('posgrado exige título universitario', () => {
      const fabrica = new ConvocatoriaPosgradoFactory();

      expect(fabrica.requisitosPorDefecto()).toContain(Requisito.TITULO_UNIVERSITARIO);
      expect(fabrica.documentosPorDefecto()).toContain(TipoDocumento.TITULO_UNIVERSITARIO);
    });

    it(`posgrado admite hasta ${MAX_CUPOS_POSGRADO} cupos y rechaza uno más`, () => {
      const fabrica = new ConvocatoriaPosgradoFactory();

      expect(() => fabrica.crear(datos({ cupos: MAX_CUPOS_POSGRADO }))).not.toThrow();
      expect(() => fabrica.crear(datos({ cupos: MAX_CUPOS_POSGRADO + 1 }))).toThrow(
        /máximo 50 cupos/,
      );
    });

    it('el tope de posgrado NO se aplica a los otros tipos', () => {
      // La prueba de que la regla quedó encapsulada en su fábrica y no se filtró al algoritmo
      // común: es exactamente lo que el patrón promete.
      expect(() =>
        new ConvocatoriaUniversitariaFactory().crear(datos({ cupos: 500 })),
      ).not.toThrow();
      expect(() => new ConvocatoriaNivelMedioFactory().crear(datos({ cupos: 1000 }))).not.toThrow();
    });
  });
});
