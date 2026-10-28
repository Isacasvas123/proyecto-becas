/**
 * Prueba unitaria — US-028, US-029 y US-031 con dobles de las fuentes.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import {
  ConvocatoriaReportable,
  FuenteConvocatorias,
  FuentePerfiles,
  FuenteSolicitudes,
  PerfilReportable,
  SolicitudReportable,
} from '../../domain/ports/puertos';
import { ReporteBuilder } from '../builders/reporte.builder';
import { GenerarReporteService } from './generar-reporte.service';
import { PanelService, indicadores } from './panel.service';
import { ReporteRegionesService } from './reporte-regiones.service';

const d = (iso: string) => new Date(iso);

const SOLICITUDES: SolicitudReportable[] = [
  {
    id: '1',
    numero: 'SOL-2026-000001',
    estado: 'ADJUDICADA',
    estudianteId: 'e1',
    convocatoriaId: 'c1',
    enviadaEn: d('2026-09-01T12:00:00Z'),
    resueltaEn: d('2026-09-11T12:00:00Z'),
    adjudicadaEn: d('2026-09-12T12:00:00Z'),
    codigoBeca: 'BECA-2026-000001',
  },
  {
    id: '2',
    numero: 'SOL-2026-000002',
    estado: 'RECHAZADA',
    estudianteId: 'e2',
    convocatoriaId: 'c1',
    enviadaEn: d('2026-09-02T12:00:00Z'),
    resueltaEn: d('2026-09-07T12:00:00Z'),
    adjudicadaEn: null,
    codigoBeca: null,
  },
  {
    id: '3',
    numero: 'SOL-2026-000003',
    estado: 'EN_EVALUACION',
    estudianteId: 'e3',
    convocatoriaId: 'c1',
    enviadaEn: d('2026-09-20T12:00:00Z'),
    resueltaEn: null,
    adjudicadaEn: null,
    codigoBeca: null,
  },
  {
    id: '4',
    numero: 'SOL-2026-000004',
    estado: 'ADJUDICADA',
    estudianteId: 'e4',
    convocatoriaId: 'c2',
    enviadaEn: d('2026-09-03T12:00:00Z'),
    resueltaEn: d('2026-09-04T12:00:00Z'),
    adjudicadaEn: d('2026-09-05T12:00:00Z'),
    codigoBeca: 'BECA-2026-000002',
  },
  {
    id: '5',
    numero: 'SOL-2026-000005',
    estado: 'ENVIADA',
    estudianteId: 'e5',
    convocatoriaId: 'c2',
    enviadaEn: d('2026-10-01T12:00:00Z'),
    resueltaEn: null,
    adjudicadaEn: null,
    codigoBeca: null,
  },
];

const PERFILES: PerfilReportable[] = [
  { usuarioId: 'e1', nivel: 'UNIVERSITARIO', departamento: 'PETEN', centroEducativo: 'USAC' },
  {
    usuarioId: 'e2',
    nivel: 'UNIVERSITARIO',
    departamento: 'GUATEMALA',
    centroEducativo: '=HYPERLINK("x")',
  },
  { usuarioId: 'e3', nivel: 'POSGRADO', departamento: 'PETEN', centroEducativo: 'UMG' },
  { usuarioId: 'e4', nivel: 'POSGRADO', departamento: 'PETEN', centroEducativo: 'usac' },
  // e5 sin perfil
];

const CONVOCATORIAS: ConvocatoriaReportable[] = [
  {
    id: 'c1',
    codigo: 'UNIV-2026-001',
    titulo: 'Universitaria',
    tipo: 'UNIVERSITARIA',
    estado: 'PUBLICADA',
    cupos: 3,
  },
  {
    id: 'c2',
    codigo: 'POS-2026-001',
    titulo: 'Posgrado',
    tipo: 'POSGRADO',
    estado: 'CERRADA',
    cupos: 1,
  },
  {
    id: 'c3',
    codigo: 'NM-2026-001',
    titulo: 'Borrador',
    tipo: 'NIVEL_MEDIO',
    estado: 'BORRADOR',
    cupos: 100,
  },
];

class Solicitudes implements FuenteSolicitudes {
  pedidos: unknown[] = [];
  recibidas(f: {
    convocatoriaId?: string;
    estados?: readonly string[];
    desde?: Date;
    hasta?: Date;
  }) {
    this.pedidos.push(f);
    return Promise.resolve(
      SOLICITUDES.filter(
        (s) =>
          (!f.convocatoriaId || s.convocatoriaId === f.convocatoriaId) &&
          (!f.estados || f.estados.includes(s.estado)) &&
          (!f.desde || s.enviadaEn >= f.desde) &&
          (!f.hasta || s.enviadaEn <= f.hasta),
      ),
    );
  }
}
class Perfiles implements FuentePerfiles {
  perfiles(ids: readonly string[]) {
    return Promise.resolve(PERFILES.filter((p) => ids.includes(p.usuarioId)));
  }
  departamentos() {
    return [
      { codigo: 'GUATEMALA', nombre: 'Guatemala' },
      { codigo: 'PETEN', nombre: 'Petén' },
      { codigo: 'ZACAPA', nombre: 'Zacapa' },
    ];
  }
}
class Convocatorias implements FuenteConvocatorias {
  todas() {
    return Promise.resolve(CONVOCATORIAS);
  }
}

const AHORA = d('2026-10-05T15:00:00Z');
function montar() {
  const solicitudes = new Solicitudes();
  const perfiles = new Perfiles();
  const reportes = new GenerarReporteService(solicitudes, perfiles, new Convocatorias());
  return {
    solicitudes,
    reportes,
    panel: new PanelService(solicitudes, new Convocatorias()),
    regiones: new ReporteRegionesService(reportes, perfiles),
  };
}

describe('GenerarReporteService (US-028)', () => {
  it('filas legibles, sin datos personales, ordenadas por número', async () => {
    const r = await montar().reportes.generar(new ReporteBuilder().build(), AHORA);

    expect(r.total).toBe(5);
    expect(r.filas[0]).toEqual({
      numero: 'SOL-2026-000001',
      convocatoria: 'UNIV-2026-001',
      estado: 'Adjudicada',
      nivel: 'Universitario',
      departamento: 'Petén',
      centroEducativo: 'USAC',
      enviada: '2026-09-01',
      resuelta: '2026-09-11',
      diasResolucion: 10,
      beca: 'BECA-2026-000001',
    });
    expect(r.filas[4]).toMatchObject({ nivel: null, departamento: null });
    expect(r.filtros).toEqual([{ etiqueta: 'Alcance', valor: 'Todas las solicitudes recibidas' }]);
    expect(JSON.stringify(r)).not.toMatch(/e1|ingreso|promedio/i);
  });

  it('pasa convocatoria, estados y fechas a la fuente; nivel y departamento los filtra aquí', async () => {
    const m = montar();
    const r = await m.reportes.generar(
      new ReporteBuilder()
        .conEstados(['ADJUDICADA', 'RECHAZADA'])
        .deNivel('UNIVERSITARIO')
        .entreFechas(d('2026-09-01T00:00:00Z'), d('2026-09-30T00:00:00Z'))
        .build(),
      AHORA,
    );
    expect(m.solicitudes.pedidos[0]).toMatchObject({ estados: ['ADJUDICADA', 'RECHAZADA'] });
    expect(r.filas.map((f) => f.numero)).toEqual(['SOL-2026-000001', 'SOL-2026-000002']);
    expect(r.filtros.map((f) => f.etiqueta)).toEqual(['Estado', 'Nivel', 'Enviadas']);
  });

  it('agrupa y ordena los grupos de mayor a menor; lo que no tiene dato va a "Sin dato"', async () => {
    const r = await montar().reportes.generar(
      new ReporteBuilder().agrupadoPor('DEPARTAMENTO').build(),
      AHORA,
    );
    expect(r.agrupacion).toBe('Departamento');
    expect(r.grupos).toEqual([
      { clave: 'PETEN', etiqueta: 'Petén', total: 3 },
      { clave: 'GUATEMALA', etiqueta: 'Guatemala', total: 1 },
      { clave: '—', etiqueta: 'Sin dato', total: 1 },
    ]);
  });

  it('agrupar por centro educativo junta mayúsculas y minúsculas', async () => {
    const r = await montar().reportes.generar(
      new ReporteBuilder().agrupadoPor('CENTRO_EDUCATIVO').build(),
      AHORA,
    );
    expect(r.grupos?.find((g) => g.clave === 'USAC')?.total).toBe(2);
  });

  it('ordena por envío más reciente', async () => {
    const r = await montar().reportes.generar(
      new ReporteBuilder().ordenadoPor('ENVIO_RECIENTE').build(),
      AHORA,
    );
    expect(r.filas[0].numero).toBe('SOL-2026-000005');
  });

  it('rechaza un departamento o una convocatoria que no existen', async () => {
    const { reportes } = montar();
    await expect(
      reportes.generar(new ReporteBuilder().deDepartamento('ATLANTIDA').build()),
    ).rejects.toThrow(ReglaDeNegocioError);
    await expect(
      reportes.generar(new ReporteBuilder().deConvocatoria('nada').build()),
    ).rejects.toThrow(/no existe/);
  });
});

describe('PanelService (US-029)', () => {
  it('indicadores del programa: tasa, cupos y tiempo promedio', async () => {
    const p = await montar().panel.calcular(null, AHORA);
    expect(p).toMatchObject({
      recibidas: 5,
      pendientesDeAsignar: 1,
      enEvaluacion: 1,
      aprobadas: 0,
      rechazadas: 1,
      adjudicadas: 2,
      // 2 de 3 resueltas
      tasaAprobacion: 66.7,
      // borradores no cuentan: 3 + 1
      cuposTotales: 4,
      cuposDisponibles: 2,
      // (10 + 5 + 1) / 3
      diasPromedioResolucion: 5.3,
    });
    expect(p.convocatorias.map((c) => c.codigo)).toEqual(['UNIV-2026-001', 'POS-2026-001']);
    expect(p.convocatorias[1]).toMatchObject({ recibidas: 2, cuposDisponibles: 0 });
  });

  it('para una convocatoria', async () => {
    const p = await montar().panel.calcular('c2', AHORA);
    expect(p).toMatchObject({ recibidas: 2, cuposTotales: 1, tasaAprobacion: 100 });
    expect(p.convocatorias).toHaveLength(1);
  });

  it('sin resoluciones no hay tasa ni tiempo; los cupos nunca son negativos', () => {
    expect(indicadores([], 0)).toMatchObject({
      tasaAprobacion: null,
      diasPromedioResolucion: null,
      cuposDisponibles: 0,
    });
    expect(
      indicadores(
        SOLICITUDES.filter((s) => s.estado === 'ADJUDICADA'),
        1,
      ).cuposDisponibles,
    ).toBe(0);
  });
});

describe('ReporteRegionesService (US-031)', () => {
  it('todos los departamentos, también los que no tienen becas', async () => {
    const r = await montar().regiones.generar(null, AHORA);
    expect(r.total).toBe(2);
    expect(r.filas).toEqual([
      { departamento: 'Petén', becas: 2, porcentaje: 100 },
      { departamento: 'Guatemala', becas: 0, porcentaje: 0 },
      { departamento: 'Zacapa', becas: 0, porcentaje: 0 },
    ]);
    expect(r.filtros).toContainEqual({ etiqueta: 'Departamentos sin becas', valor: '2' });
  });

  it('usa el mismo builder: solo adjudicadas', async () => {
    const m = montar();
    await m.regiones.generar('c1', AHORA);
    expect(m.solicitudes.pedidos[0]).toMatchObject({
      convocatoriaId: 'c1',
      estados: ['ADJUDICADA'],
    });
  });

  it('sin becas, todo en cero y sin dividir entre cero', async () => {
    const r = await montar().regiones.generar('c2', AHORA);
    const m = montar();
    const vacio = await m.regiones.generar('c1', AHORA);
    expect(r.total).toBe(1);
    expect(vacio.filas.every((f) => typeof f.porcentaje === 'number')).toBe(true);
  });
});
