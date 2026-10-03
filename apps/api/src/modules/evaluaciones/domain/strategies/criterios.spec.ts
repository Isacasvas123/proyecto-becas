/**
 * PRUEBA UNITARIA — patrón Strategy (docs/06-patrones.md §6).
 *
 * Cada fórmula con sus casos límite, y la prueba que justifica el patrón: el mixto COMPONE a los
 * otros dos. Si mañana cambia la fórmula de necesidad, el mixto cambia con ella sin tocarse.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Puntaje } from '../value-objects/puntaje.vo';
import { CriterioEvaluacionStrategy, DatosEvaluables } from './criterio-evaluacion.strategy';
import { CriterioMeritoAcademico } from './criterio-merito-academico';
import { CriterioMixto } from './criterio-mixto';
import {
  CriterioNecesidadSocioeconomica,
  INGRESO_PER_CAPITA_MAXIMO,
  INGRESO_PER_CAPITA_MINIMO,
} from './criterio-necesidad-socioeconomica';
import { criterioPara, PESO_ACADEMICO_UNIVERSITARIA } from './criterio-por-tipo-beca';

const datos = (cambios: Partial<DatosEvaluables> = {}): DatosEvaluables => ({
  promedio: 85,
  ingresoFamiliarMensual: 3000,
  dependientes: 3,
  ...cambios,
});

describe('Criterios de evaluación (patrón Strategy)', () => {
  describe('Mérito académico', () => {
    const merito = new CriterioMeritoAcademico();

    it.each([
      [0, 0],
      [70.5, 70.5],
      [100, 100],
    ])('promedio %d → %d puntos', (promedio, esperado) => {
      expect(merito.calcular(datos({ promedio })).puntaje.valor).toBe(esperado);
    });

    it('explica de dónde sale el puntaje', () => {
      expect(merito.calcular(datos()).desglose).toEqual([
        { concepto: 'Promedio', valor: '85', aporte: 85 },
      ]);
    });

    it('sin promedio no puntúa: dice qué falta', () => {
      expect(() => merito.calcular(datos({ promedio: null }))).toThrow(/sin el promedio/);
    });
  });

  describe('Necesidad socioeconómica', () => {
    const necesidad = new CriterioNecesidadSocioeconomica();
    const puntos = (ingreso: number, dependientes: number) =>
      necesidad.calcular(datos({ ingresoFamiliarMensual: ingreso, dependientes })).puntaje.valor;

    it('en el umbral bajo o por debajo: 100', () => {
      expect(puntos(INGRESO_PER_CAPITA_MINIMO, 1)).toBe(100);
      expect(puntos(0, 1)).toBe(100);
    });

    it('en el umbral alto o por encima: 0', () => {
      expect(puntos(INGRESO_PER_CAPITA_MAXIMO, 1)).toBe(0);
      expect(puntos(50_000, 1)).toBe(0);
    });

    it('lineal en medio: Q2,750 por persona es la mitad', () => {
      expect(puntos(5500, 2)).toBe(50);
    });

    it('el mismo ingreso con más dependientes da más puntos', () => {
      expect(puntos(6000, 6)).toBeGreaterThan(puntos(6000, 2));
    });

    it('cero dependientes cuenta como una persona, no divide entre cero', () => {
      expect(puntos(2750, 0)).toBe(50);
    });

    it('el desglose muestra la cuenta', () => {
      const [linea] = necesidad.calcular(
        datos({ ingresoFamiliarMensual: 3000, dependientes: 3 }),
      ).desglose;
      expect(linea.valor).toBe('Q1000.00 (Q3000 ÷ 3)');
    });

    it('sin ingreso o sin dependientes no puntúa', () => {
      expect(() => necesidad.calcular(datos({ ingresoFamiliarMensual: null }))).toThrow(
        ReglaDeNegocioError,
      );
      expect(() => necesidad.calcular(datos({ dependientes: null }))).toThrow(ReglaDeNegocioError);
    });
  });

  describe('Mixto', () => {
    const fijo = (nombre: string, valor: number): CriterioEvaluacionStrategy => ({
      nombre,
      calcular: () => ({
        criterio: nombre,
        puntaje: Puntaje.de(valor),
        desglose: [{ concepto: nombre, valor: '', aporte: valor }],
      }),
    });

    it('pondera los dos criterios que compone', () => {
      const mixto = new CriterioMixto(fijo('A', 80), fijo('B', 40), 0.6);
      expect(mixto.calcular(datos()).puntaje.valor).toBe(64);
    });

    it('compone, no copia: usa lo que devuelva cada criterio', () => {
      const academico = fijo('A', 100);
      const espia = jest.spyOn(academico, 'calcular');
      new CriterioMixto(academico, fijo('B', 0), 0.5).calcular(datos());
      expect(espia).toHaveBeenCalledTimes(1);
    });

    it('el desglose trae las líneas de ambos con su aporte ponderado', () => {
      const mixto = new CriterioMixto(fijo('A', 80), fijo('B', 40), 0.6);
      expect(mixto.calcular(datos()).desglose.map((l) => l.aporte)).toEqual([48, 16]);
    });

    it('su nombre dice los pesos', () => {
      expect(new CriterioMixto(fijo('Uno', 0), fijo('Dos', 0), 0.6).nombre).toBe(
        'Mixto (60 % uno · 40 % dos)',
      );
    });

    it.each([-0.1, 1.1, Number.NaN])('rechaza el peso %d', (peso) => {
      expect(() => new CriterioMixto(fijo('A', 0), fijo('B', 0), peso)).toThrow(
        ReglaDeNegocioError,
      );
    });

    it('si falta un dato de cualquiera de los dos, no puntúa', () => {
      const mixto = new CriterioMixto(
        new CriterioMeritoAcademico(),
        new CriterioNecesidadSocioeconomica(),
        0.5,
      );
      expect(() => mixto.calcular(datos({ dependientes: null }))).toThrow(ReglaDeNegocioError);
    });
  });

  describe('criterio por tipo de beca', () => {
    it('nivel medio y posgrado: mérito', () => {
      expect(criterioPara('NIVEL_MEDIO')).toBeInstanceOf(CriterioMeritoAcademico);
      expect(criterioPara('POSGRADO')).toBeInstanceOf(CriterioMeritoAcademico);
    });

    it('universitaria: mixto con el peso acordado', () => {
      const criterio = criterioPara('UNIVERSITARIA');
      expect(criterio).toBeInstanceOf(CriterioMixto);
      // 85 × 0.6 + necesidad(Q1,000 por persona ≈ 88.89) × 0.4
      const necesidad = ((INGRESO_PER_CAPITA_MAXIMO - 1000) / 4500) * 100;
      expect(criterio.calcular(datos()).puntaje.valor).toBeCloseTo(
        85 * PESO_ACADEMICO_UNIVERSITARIA + necesidad * (1 - PESO_ACADEMICO_UNIVERSITARIA),
        1,
      );
    });

    it('un tipo sin criterio es un error explícito, no un cero', () => {
      expect(() => criterioPara('TECNICA')).toThrow(/No hay criterio/);
    });

    it('cubre los tres tipos de beca del catálogo', () => {
      for (const tipo of ['NIVEL_MEDIO', 'UNIVERSITARIA', 'POSGRADO']) {
        expect(() => criterioPara(tipo)).not.toThrow();
      }
    });
  });

  describe('Puntaje', () => {
    it('redondea a dos decimales y recorta a 0..100', () => {
      expect(Puntaje.de(79.999).valor).toBe(80);
      expect(Puntaje.de(-3).valor).toBe(0);
      expect(Puntaje.de(100.4).valor).toBe(100);
    });

    it('rechaza lo que no es número', () => {
      expect(() => Puntaje.de(Number.NaN)).toThrow(ReglaDeNegocioError);
    });

    it('promedia; sin puntajes, no hay promedio', () => {
      expect(Puntaje.promedio([Puntaje.de(80), Puntaje.de(71)])?.valor).toBe(75.5);
      expect(Puntaje.promedio([])).toBeNull();
    });
  });
});
