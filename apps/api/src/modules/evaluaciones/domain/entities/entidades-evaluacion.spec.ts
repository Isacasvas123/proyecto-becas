import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Recomendacion } from '../enums/recomendacion.enum';
import { Puntaje } from '../value-objects/puntaje.vo';
import { Comite } from './comite.entity';
import { Dictamen, LARGO_MINIMO_OBSERVACION } from './dictamen.entity';

const AHORA = new Date('2026-10-01T15:00:00Z');

function comite(evaluadores = ['e1', 'e2', 'e3']): Comite {
  return Comite.nuevo({
    id: 'c1',
    nombre: '  Comité   universitario ',
    convocatoriaId: 'conv',
    evaluadores,
    creadoPor: 'admin',
    creadoEn: AHORA,
  });
}

describe('Comite (US-017, CU-13)', () => {
  it('se crea con nombre limpio, integrantes y autoría', () => {
    const c = comite();
    expect(c.nombre).toBe('Comité universitario');
    expect(c.evaluadores).toEqual(['e1', 'e2', 'e3']);
    expect(c.creadoPor).toBe('admin');
    expect(c.esIntegrante('e2')).toBe(true);
    expect(c.esIntegrante('x')).toBe(false);
  });

  it('sin evaluadores no existe (6a)', () => {
    expect(() => comite([])).toThrow('Un comité necesita al menos un evaluador.');
  });

  it('sin evaluadores repetidos', () => {
    expect(() => comite(['e1', 'e1'])).toThrow(/repetidos/);
  });

  it('sin nombre no existe', () => {
    expect(() =>
      Comite.nuevo({
        id: 'c',
        nombre: ' ',
        convocatoriaId: 'x',
        evaluadores: ['e1'],
        creadoPor: 'a',
        creadoEn: AHORA,
      }),
    ).toThrow(ReglaDeNegocioError);
  });

  it('agrega integrantes nuevos e ignora los que ya estaban', () => {
    const c = comite(['e1']);
    c.agregarEvaluadores(['e1', 'e2']);
    expect(c.evaluadores).toEqual(['e1', 'e2']);
    expect(() => c.agregarEvaluadores(['e2'])).toThrow(/ya forman parte/);
  });

  it('la lista expuesta es una copia', () => {
    const c = comite();
    (c.evaluadores as string[]).pop();
    expect(c.evaluadores).toHaveLength(3);
  });

  describe('reparto equitativo (US-018, criterio 4)', () => {
    const cuenta = (plan: { evaluadorId: string }[]) =>
      plan.reduce<Record<string, number>>((m, p) => {
        m[p.evaluadorId] = (m[p.evaluadorId] ?? 0) + 1;
        return m;
      }, {});

    it('reparte por turnos: 7 solicitudes entre 3 → 3, 2, 2', () => {
      const plan = comite().repartir(['s1', 's2', 's3', 's4', 's5', 's6', 's7'], 1, new Map());
      expect(cuenta(plan)).toEqual({ e1: 3, e2: 2, e3: 2 });
    });

    it('tiene en cuenta la carga que ya había', () => {
      const plan = comite().repartir(['s1', 's2'], 1, new Map([['e1', 5]]));
      expect(plan.map((p) => p.evaluadorId)).toEqual(['e2', 'e3']);
    });

    it('dos por solicitud: nunca el mismo evaluador dos veces en la misma', () => {
      const plan = comite().repartir(['s1', 's2', 's3'], 2, new Map());
      for (const s of ['s1', 's2', 's3']) {
        const de = plan.filter((p) => p.solicitudId === s).map((p) => p.evaluadorId);
        expect(new Set(de).size).toBe(2);
      }
      expect(cuenta(plan)).toEqual({ e1: 2, e2: 2, e3: 2 });
    });

    it('repartir en dos tandas deja el mismo equilibrio', () => {
      const c = comite();
      const primera = c.repartir(['s1', 's2'], 1, new Map());
      const carga = new Map(Object.entries(cuenta(primera)));
      const segunda = c.repartir(['s3', 's4', 's5', 's6'], 1, carga);
      expect(cuenta([...primera, ...segunda])).toEqual({ e1: 2, e2: 2, e3: 2 });
    });

    it.each([0, 1.5, 4])('rechaza %d evaluadores por solicitud con 3 integrantes', (n) => {
      expect(() => comite().repartir(['s1'], n, new Map())).toThrow(ReglaDeNegocioError);
    });
  });
});

describe('Dictamen (US-019)', () => {
  const resultado = {
    criterio: 'Mérito académico',
    puntaje: Puntaje.de(85),
    desglose: [{ concepto: 'Promedio', valor: '85', aporte: 85 }],
  };
  const emitir = (observacion: string) =>
    Dictamen.emitir({
      id: 'd1',
      solicitudId: 's1',
      evaluadorId: 'e1',
      resultado,
      recomendacion: Recomendacion.FAVORABLE,
      observacion,
      ahora: AHORA,
    });

  it('guarda criterio, puntaje, desglose, autor y fecha', () => {
    const d = emitir('  Cumple con holgura el promedio exigido.  ');
    expect(d).toMatchObject({
      criterio: 'Mérito académico',
      evaluadorId: 'e1',
      emitidoEn: AHORA,
      observacion: 'Cumple con holgura el promedio exigido.',
    });
    expect(d.puntaje.valor).toBe(85);
  });

  it('sin una observación que justifique no se emite (criterio 3)', () => {
    expect(() => emitir('ok')).toThrow(
      `la observación debe tener al menos ${LARGO_MINIMO_OBSERVACION} caracteres`,
    );
    expect(() => emitir(' '.repeat(40))).toThrow(ReglaDeNegocioError);
  });

  it('no se puede modificar después de emitido (criterio 4)', () => {
    const d = emitir('Cumple con holgura el promedio exigido.');
    expect(() => {
      (d as { observacion: string }).observacion = 'cambiada';
    }).toThrow(TypeError);
    expect(() => {
      (d.desglose as unknown[]).push({});
    }).toThrow(TypeError);
  });
});
