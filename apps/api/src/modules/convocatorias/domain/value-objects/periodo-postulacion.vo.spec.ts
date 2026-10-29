/**
 * Pruebas del objeto de valor. TypeScript puro, sin framework.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { PeriodoPostulacion } from './periodo-postulacion.vo';

const APERTURA = new Date('2026-09-01T00:00:00.000Z');
const CIERRE = new Date('2026-10-31T23:59:59.000Z');

describe('PeriodoPostulacion (objeto de valor)', () => {
  it('se construye cuando el cierre es posterior a la apertura', () => {
    const periodo = PeriodoPostulacion.crear(APERTURA, CIERRE);

    expect(periodo.apertura).toEqual(APERTURA);
    expect(periodo.cierre).toEqual(CIERRE);
  });

  // US-006: "La fecha de cierre debe ser posterior a la de apertura."
  it('rechaza un cierre anterior a la apertura', () => {
    expect(() => PeriodoPostulacion.crear(CIERRE, APERTURA)).toThrow(ReglaDeNegocioError);
  });

  it('rechaza un cierre igual a la apertura', () => {
    expect(() => PeriodoPostulacion.crear(APERTURA, APERTURA)).toThrow(ReglaDeNegocioError);
  });

  it('rechaza fechas inválidas', () => {
    expect(() => PeriodoPostulacion.crear(new Date('no-es-fecha'), CIERRE)).toThrow(
      ReglaDeNegocioError,
    );
  });

  it('es inmutable: no se puede alterar tras construirlo', () => {
    const periodo = PeriodoPostulacion.crear(APERTURA, CIERRE);

    expect(Object.isFrozen(periodo)).toBe(true);
  });

  it('no comparte referencia con las fechas recibidas (copia defensiva)', () => {
    const apertura = new Date(APERTURA);
    const periodo = PeriodoPostulacion.crear(apertura, CIERRE);

    apertura.setFullYear(1999);

    expect(periodo.apertura.getFullYear()).toBe(2026);
  });

  describe('contiene', () => {
    const periodo = PeriodoPostulacion.crear(APERTURA, CIERRE);

    it('incluye una fecha intermedia', () => {
      expect(periodo.contiene(new Date('2026-09-15T12:00:00.000Z'))).toBe(true);
    });

    it('excluye una fecha anterior a la apertura', () => {
      expect(periodo.contiene(new Date('2026-08-31T23:59:59.000Z'))).toBe(false);
    });

    it('excluye una fecha posterior al cierre', () => {
      expect(periodo.contiene(new Date('2026-11-01T00:00:00.000Z'))).toBe(false);
    });
  });

  describe('haVencido', () => {
    const periodo = PeriodoPostulacion.crear(APERTURA, CIERRE);

    it('no ha vencido dentro del periodo', () => {
      expect(periodo.haVencido(new Date('2026-09-15T12:00:00.000Z'))).toBe(false);
    });

    it('ha vencido después del cierre', () => {
      expect(periodo.haVencido(new Date('2026-11-01T00:00:00.000Z'))).toBe(true);
    });
  });

  it('compara por valor, no por referencia', () => {
    const uno = PeriodoPostulacion.crear(APERTURA, CIERRE);
    const otro = PeriodoPostulacion.crear(new Date(APERTURA), new Date(CIERRE));

    expect(uno.equals(otro)).toBe(true);
    expect(uno === otro).toBe(false);
  });
});
