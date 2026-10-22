/**
 * PRUEBA UNITARIA — EPIC-05 (US-023 a US-025): la fachada de resolución y la consulta pública.
 *
 * Los colaboradores se sustituyen por dobles de sus PUERTOS. Es lo que el patrón Facade permite
 * probar: que la fachada coordina en el orden correcto y que el controlador no tiene que saberlo.
 */
import {
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../shared/exceptions/errores-dominio';
import {
  ConsultaConvocatoriasResolucion,
  ConsultaDictamenes,
  ConsultaIdentidad,
  ConsultaSolicitudesResolucion,
  Decision,
  SolicitudResoluble,
} from '../domain/ports/consultas-externas';
import { AvisoResolucion, NotificadorResoluciones } from '../domain/ports/notificador-resoluciones';
import { OcupacionCupos } from '../domain/value-objects/ocupacion-cupos.vo';
import { ResolucionFacade } from './facades/resolucion.facade';
import {
  ConsultaPublicaService,
  MENSAJE_CONSULTA_SIN_RESULTADO,
} from './services/consulta-publica.service';

const MOTIVO = 'Cumple los requisitos y su puntaje está dentro de los cupos.';

class SolicitudesFalsas implements ConsultaSolicitudesResolucion {
  readonly datos = new Map<string, SolicitudResoluble>();
  resoluciones: { id: string; decision: Decision; motivo: string; cupos: number }[] = [];

  agregar(id: string, estado: string, estudianteId = 'est-1') {
    this.datos.set(id, {
      id,
      numero: `SOL-2026-00000${this.datos.size + 1}`,
      estado,
      estudianteId,
      convocatoriaId: 'conv',
      ultimoCambio: '2026-10-05T10:00:00.000Z',
      beca: null,
    });
  }
  buscar(id: string) {
    return Promise.resolve(this.datos.get(id) ?? null);
  }
  buscarPorNumero(numero: string) {
    return Promise.resolve([...this.datos.values()].find((s) => s.numero === numero) ?? null);
  }
  resolver(id: string, decision: Decision, motivo: string, _autor: string, cupos: number) {
    const s = this.datos.get(id)!;
    if (s.estado !== 'EN_EVALUACION') {
      return Promise.reject(new TransicionInvalidaError(`No se puede resolver en ${s.estado}.`));
    }
    this.resoluciones.push({ id, decision, motivo, cupos });
    const nueva = { ...s, estado: decision === 'APROBAR' ? 'APROBADA' : 'RECHAZADA' };
    this.datos.set(id, nueva);
    return Promise.resolve(nueva);
  }
  confirmarAprobacion(id: string, motivo: string, _autor: string, cupos: number) {
    const s = this.datos.get(id)!;
    if (s.estado !== 'APROBACION_PENDIENTE') {
      return Promise.reject(
        new TransicionInvalidaError(`No se puede confirmar la aprobación en ${s.estado}.`),
      );
    }
    this.resoluciones.push({ id, decision: 'APROBAR' as Decision, motivo, cupos });
    const nueva = { ...s, estado: 'APROBADA' };
    this.datos.set(id, nueva);
    return Promise.resolve(nueva);
  }
  adjudicar(id: string) {
    const s = this.datos.get(id)!;
    if (s.estado !== 'APROBADA') {
      return Promise.reject(new TransicionInvalidaError(`No se puede adjudicar en ${s.estado}.`));
    }
    const nueva = {
      ...s,
      estado: 'ADJUDICADA',
      beca: { codigo: 'BECA-2026-000001', otorgadaEn: '2026-10-06T10:00:00.000Z' },
    };
    this.datos.set(id, nueva);
    return Promise.resolve(nueva);
  }
  ocupacion() {
    const todas = [...this.datos.values()];
    return Promise.resolve({
      aprobadas: todas.filter((s) => s.estado === 'APROBADA').length,
      adjudicadas: todas.filter((s) => s.estado === 'ADJUDICADA').length,
    });
  }
}

class DictamenesFalsos implements ConsultaDictamenes {
  readonly total = new Map<string, number>();
  resumen(solicitudId: string) {
    const total = this.total.get(solicitudId) ?? 0;
    return Promise.resolve({ total, favorables: total, desfavorables: 0, puntajePromedio: null });
  }
}

class ConvocatoriasFalsas implements ConsultaConvocatoriasResolucion {
  cupos = 1;
  buscar(id: string) {
    return Promise.resolve(
      id === 'conv' ? { id, codigo: 'UNIV-2026-001', titulo: 'Beca', cupos: this.cupos } : null,
    );
  }
}

class NotificadorEspia implements NotificadorResoluciones {
  avisos: AvisoResolucion[] = [];
  falla = false;
  cambioDeEstado(aviso: AvisoResolucion) {
    if (this.falla) return Promise.reject(new Error('SMTP caído'));
    this.avisos.push(aviso);
    return Promise.resolve();
  }
}

function montar() {
  const solicitudes = new SolicitudesFalsas();
  const dictamenes = new DictamenesFalsos();
  const convocatorias = new ConvocatoriasFalsas();
  const notificador = new NotificadorEspia();
  solicitudes.agregar('s1', 'EN_EVALUACION');
  solicitudes.agregar('s2', 'EN_EVALUACION', 'est-2');
  dictamenes.total.set('s1', 2);
  dictamenes.total.set('s2', 1);
  return {
    solicitudes,
    dictamenes,
    convocatorias,
    notificador,
    fachada: new ResolucionFacade(solicitudes, dictamenes, convocatorias, notificador),
  };
}

describe('OcupacionCupos', () => {
  it('aprobadas y adjudicadas ocupan cupo', () => {
    const o = new OcupacionCupos(5, 2, 1);
    expect(o.ocupados).toBe(3);
    expect(o.disponibles).toBe(2);
    expect(() => o.asegurarCupoParaAprobar()).not.toThrow();
  });

  it('sin cupo no se aprueba; nunca hay disponibles negativos', () => {
    const o = new OcupacionCupos(2, 2, 1);
    expect(o.disponibles).toBe(0);
    expect(() => o.asegurarCupoParaAprobar()).toThrow(
      /ya no tiene cupos disponibles \(2 en total\)/,
    );
  });
});

describe('ResolucionFacade (patrón Facade)', () => {
  describe('resolver (US-023)', () => {
    it('aprueba, pasa el cupo al repositorio, avisa y devuelve la ocupación', async () => {
      const m = montar();
      const r = await m.fachada.resolver('s1', 'APROBAR', `  ${MOTIVO}  `, 'admin');

      expect(r).toMatchObject({
        numero: 'SOL-2026-000001',
        estado: 'APROBADA',
        cupos: { cupos: 1, aprobadas: 1, disponibles: 0 },
      });
      expect(m.solicitudes.resoluciones).toEqual([
        { id: 's1', decision: 'APROBAR', motivo: MOTIVO, cupos: 1 },
      ]);
      expect(m.notificador.avisos).toEqual([
        {
          estudianteId: 'est-1',
          numero: 'SOL-2026-000001',
          estado: 'APROBADA',
          motivo: MOTIVO,
          codigoBeca: null,
        },
      ]);
    });

    it('rechazar no necesita cupo', async () => {
      const m = montar();
      await m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin');
      const r = await m.fachada.resolver(
        's2',
        'RECHAZAR',
        'Ingreso por persona por encima del límite.',
        'admin',
      );
      expect(r.estado).toBe('RECHAZADA');
    });

    it('sin cupo no aprueba y no toca la solicitud (criterio 4)', async () => {
      const m = montar();
      await m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin');

      await expect(m.fachada.resolver('s2', 'APROBAR', MOTIVO, 'admin')).rejects.toThrow(
        /ya no tiene cupos/,
      );
      expect(m.solicitudes.datos.get('s2')?.estado).toBe('EN_EVALUACION');
      expect(m.notificador.avisos).toHaveLength(1);
    });

    it('sin dictámenes no se resuelve (criterio 1)', async () => {
      const m = montar();
      m.dictamenes.total.set('s1', 0);
      await expect(m.fachada.resolver('s1', 'RECHAZAR', MOTIVO, 'admin')).rejects.toThrow(
        /no tiene ningún dictamen/,
      );
      expect(m.solicitudes.resoluciones).toHaveLength(0);
    });

    it.each(['APROBAR', 'RECHAZAR'] as const)(
      'el motivo es obligatorio también para %s (criterio 2)',
      async (decision) => {
        const m = montar();
        await expect(m.fachada.resolver('s1', decision, '   no   ', 'admin')).rejects.toThrow(
          /Escriba el motivo/,
        );
        expect(m.solicitudes.resoluciones).toHaveLength(0);
      },
    );

    it('404 si la solicitud no existe', async () => {
      await expect(montar().fachada.resolver('nada', 'APROBAR', MOTIVO, 'admin')).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('una solicitud que no está en evaluación responde con transición inválida', async () => {
      const m = montar();
      await m.fachada.resolver('s1', 'RECHAZAR', MOTIVO, 'admin');
      await expect(m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin')).rejects.toThrow(
        TransicionInvalidaError,
      );
    });

    it('si falla el aviso, la resolución queda hecha', async () => {
      const m = montar();
      m.notificador.falla = true;
      await expect(m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin')).resolves.toMatchObject({
        estado: 'APROBADA',
      });
    });
  });

  describe('adjudicar (US-024)', () => {
    it('adjudica una aprobada, devuelve la beca y avisa con su código', async () => {
      const m = montar();
      await m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin');
      const r = await m.fachada.adjudicar('s1', 'admin');

      expect(r).toMatchObject({
        estado: 'ADJUDICADA',
        beca: { codigo: 'BECA-2026-000001' },
        cupos: { aprobadas: 0, adjudicadas: 1, disponibles: 0 },
      });
      expect(m.notificador.avisos.at(-1)).toMatchObject({
        estado: 'ADJUDICADA',
        codigoBeca: 'BECA-2026-000001',
      });
    });

    it('no adjudica lo que no está aprobado', async () => {
      await expect(montar().fachada.adjudicar('s1', 'admin')).rejects.toThrow(
        TransicionInvalidaError,
      );
    });
  });

  it('cupos de una convocatoria; 404 si no existe', async () => {
    const m = montar();
    m.convocatorias.cupos = 3;
    await m.fachada.resolver('s1', 'APROBAR', MOTIVO, 'admin');
    await expect(m.fachada.cupos('conv')).resolves.toEqual({
      convocatoriaId: 'conv',
      cupos: 3,
      aprobadas: 1,
      adjudicadas: 0,
      disponibles: 2,
    });
    await expect(m.fachada.cupos('otra')).rejects.toThrow(RecursoNoEncontradoError);
  });
});

describe('ConsultaPublicaService (US-025)', () => {
  class IdentidadFalsa implements ConsultaIdentidad {
    llamadas: string[] = [];
    cuiCoincide(usuarioId: string, cui: string) {
      this.llamadas.push(usuarioId);
      return Promise.resolve(usuarioId === 'est-1' && cui === '1234567890101');
    }
  }

  function consulta() {
    const { solicitudes } = montar();
    const identidad = new IdentidadFalsa();
    return { identidad, servicio: new ConsultaPublicaService(solicitudes, identidad) };
  }

  it('con número y CUI correctos devuelve SOLO estado y fecha (criterio 2)', async () => {
    const r = await consulta().servicio.consultar(' sol-2026-000001 ', '1234567890101');
    expect(r).toEqual({
      numero: 'SOL-2026-000001',
      estado: 'EN_EVALUACION',
      ultimoCambio: '2026-10-05T10:00:00.000Z',
    });
  });

  it('el mismo mensaje para un CUI equivocado y para un número inexistente (criterio 3)', async () => {
    const { servicio } = consulta();
    const errores = await Promise.all([
      servicio.consultar('SOL-2026-000001', '9999999990101').catch((e: unknown) => e as Error),
      servicio.consultar('SOL-2026-999999', '1234567890101').catch((e: unknown) => e as Error),
      servicio.consultar('SOL-2026-000002', '1234567890101').catch((e: unknown) => e as Error),
    ]);
    for (const e of errores as Error[]) {
      expect(e).toBeInstanceOf(RecursoNoEncontradoError);
      expect(e.message).toBe(MENSAJE_CONSULTA_SIN_RESULTADO);
    }
  });

  it('comprueba la identidad aunque el número no exista, para no delatarlo por el tiempo', async () => {
    const { servicio, identidad } = consulta();
    await servicio.consultar('SOL-2026-999999', 'x').catch(() => undefined);
    expect(identidad.llamadas).toHaveLength(1);
  });
});

it('ReglaDeNegocioError sigue siendo la clase de los errores de regla', () => {
  expect(new ReglaDeNegocioError('x')).toBeInstanceOf(Error);
});
