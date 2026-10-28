/**
 * Prueba unitaria — patrón Builder (docs/06-patrones.md §2).
 * Lo que se verifica es lo que justifica el patrón: que `build()` rechace combinaciones
 * incoherentes y que lo construido no cambie aunque el builder se siga usando.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { ReporteBuilder } from './reporte.builder';

const SEPT = new Date('2026-09-01T06:00:00Z');
const OCT = new Date('2026-10-01T06:00:00Z');

describe('ReporteBuilder (patrón Builder)', () => {
  it('sin pasos: todas las recibidas, por número, en JSON', () => {
    expect(new ReporteBuilder().build()).toEqual({
      convocatoriaId: null,
      estados: null,
      nivel: null,
      departamento: null,
      desde: null,
      hasta: null,
      agrupacion: null,
      orden: 'NUMERO',
      formato: 'JSON',
    });
  });

  it('cada paso fija solo lo suyo, en cualquier orden', () => {
    const spec = new ReporteBuilder()
      .enFormato('CSV')
      .agrupadoPor('DEPARTAMENTO')
      .entreFechas(SEPT, OCT)
      .deNivel('POSGRADO')
      .conEstados(['APROBADA', 'ADJUDICADA', 'APROBADA'])
      .ordenadoPor('ENVIO_RECIENTE')
      .build();

    expect(spec).toMatchObject({
      estados: ['APROBADA', 'ADJUDICADA'],
      nivel: 'POSGRADO',
      desde: SEPT,
      hasta: OCT,
      agrupacion: 'DEPARTAMENTO',
      orden: 'ENVIO_RECIENTE',
      formato: 'CSV',
    });
  });

  it('lo construido es inmutable y no cambia si el builder se sigue usando', () => {
    const builder = new ReporteBuilder().conEstados(['APROBADA']);
    const primero = builder.build();
    builder.conEstados(['RECHAZADA']).enFormato('PDF');

    expect(primero.estados).toEqual(['APROBADA']);
    expect(primero.formato).toBe('JSON');
    expect(Object.isFrozen(primero)).toBe(true);
    expect(() => (primero.estados as string[]).push('X')).toThrow(TypeError);
  });

  describe('build() rechaza combinaciones incoherentes', () => {
    it('fechas al revés', () => {
      expect(() => new ReporteBuilder().entreFechas(OCT, SEPT).build()).toThrow(
        'La fecha inicial no puede ser posterior a la final.',
      );
    });

    it('lista de estados vacía', () => {
      expect(() => new ReporteBuilder().conEstados([]).build()).toThrow(/al menos un estado/);
    });

    it.each([
      ['convocatoria', (b: ReporteBuilder) => b.deConvocatoria('c1').agrupadoPor('CONVOCATORIA')],
      ['nivel', (b: ReporteBuilder) => b.deNivel('POSGRADO').agrupadoPor('NIVEL')],
      [
        'departamento',
        (b: ReporteBuilder) => b.deDepartamento('PETEN').agrupadoPor('DEPARTAMENTO'),
      ],
      ['un solo estado', (b: ReporteBuilder) => b.conEstados(['APROBADA']).agrupadoPor('ESTADO')],
    ])('agrupar por el mismo dato filtrado: %s', (_caso, preparar) => {
      expect(() => preparar(new ReporteBuilder()).build()).toThrow(/deja un solo grupo/);
    });

    it('agrupar por estado con varios estados sí tiene sentido', () => {
      expect(() =>
        new ReporteBuilder().conEstados(['APROBADA', 'RECHAZADA']).agrupadoPor('ESTADO').build(),
      ).not.toThrow();
    });
  });

  describe('cada paso rechaza valores fuera de catálogo', () => {
    it.each([
      ['un borrador', (b: ReporteBuilder) => b.conEstados(['BORRADOR'])],
      ['un nivel inventado', (b: ReporteBuilder) => b.deNivel('DOCTORADO')],
      ['un departamento mal escrito', (b: ReporteBuilder) => b.deDepartamento('petén')],
      ['una agrupación inventada', (b: ReporteBuilder) => b.agrupadoPor('SEXO')],
      ['un orden inventado', (b: ReporteBuilder) => b.ordenadoPor('AZAR')],
      ['un formato inventado', (b: ReporteBuilder) => b.enFormato('XLSX')],
    ])('%s', (_caso, paso) => {
      expect(() => paso(new ReporteBuilder())).toThrow(ReglaDeNegocioError);
    });
  });
});
