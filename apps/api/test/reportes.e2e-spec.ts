/**
 * PRUEBA DE INTEGRACIÓN — EPIC-06 sobre datos producidos por el flujo real:
 * dos solicitudes enviadas, evaluadas, una aprobada y adjudicada y la otra rechazada.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

import {
  OBSERVACION,
  admin,
  ana,
  montarPlataforma,
  pasos,
} from './utilidades/plataforma-de-prueba';

const MOTIVO = 'Decisión tomada según el consolidado del comité.';

/** Lee el cuerpo como Buffer, sin que supertest intente interpretarlo. */
const binario = (res: request.Response, fin: (e: Error | null, b: Buffer) => void) => {
  const partes: Buffer[] = [];
  res.on('data', (c: Buffer) => partes.push(c));
  res.on('end', () => fin(null, Buffer.concat(partes)));
};

describe('Reportes y estadísticas (e2e)', () => {
  let app: INestApplication<App>;
  let p: ReturnType<typeof pasos>;

  beforeEach(async () => {
    app = await montarPlataforma();
    p = pasos(app);
  });

  afterEach(async () => {
    await app.close();
  });

  /** Ana (Petén) adjudicada, Luis (Petén también) rechazado. Una convocatoria de 1 cupo. */
  async function datos() {
    const e = await p.escenario(1);
    const s = p.servidor();
    await s
      .post(`/comites/${e.comiteId}/asignaciones`)
      .set(admin)
      .send({ modo: 'AUTOMATICO', porSolicitud: 1 })
      .expect(200);
    for (const id of [e.solAna, e.solLuis]) {
      await p
        .servidor()
        .post(`/evaluaciones/solicitudes/${id}/dictamen`)
        .set(e.eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
        .expect(201);
    }
    await p
      .servidor()
      .post(`/resoluciones/solicitudes/${e.solAna}`)
      .set(admin)
      .send({ decision: 'APROBAR', motivo: MOTIVO })
      .expect(200);
    await p
      .servidor()
      .post(`/resoluciones/solicitudes/${e.solAna}/adjudicar`)
      .set(admin)
      .expect(200);
    await p
      .servidor()
      .post(`/resoluciones/solicitudes/${e.solLuis}`)
      .set(admin)
      .send({ decision: 'RECHAZAR', motivo: MOTIVO })
      .expect(200);
    return e;
  }

  it('solo administración', async () => {
    const e = await p.escenario(1);
    for (const ruta of ['/reportes/solicitudes', '/reportes/panel', '/reportes/regiones']) {
      await p.servidor().get(ruta).set(ana).expect(403);
      await p.servidor().get(ruta).set(e.eva.token).expect(403);
      await p.servidor().get(ruta).expect(401);
    }
  });

  describe('US-028', () => {
    it('todas las recibidas, con nombres legibles y sin datos personales', async () => {
      await datos();
      const { body } = await p.servidor().get('/reportes/solicitudes').set(admin).expect(200);

      expect(body.total).toBe(2);
      expect(body.filas.map((f: { estado: string }) => f.estado)).toEqual([
        'Adjudicada',
        'Rechazada',
      ]);
      expect(body.filas[0]).toMatchObject({
        nivel: 'Universitario',
        departamento: 'Petén',
        beca: expect.stringMatching(/^BECA-/),
      });
      expect(JSON.stringify(body)).not.toMatch(/Ana|López|1111111110101|ingreso/);
    });

    it('filtros combinados y agrupación', async () => {
      await datos();
      const { body } = await p
        .servidor()
        .get('/reportes/solicitudes')
        .query({
          estado: 'ADJUDICADA,RECHAZADA',
          nivel: 'UNIVERSITARIO',
          agruparPor: 'ESTADO',
          ordenarPor: 'ENVIO_RECIENTE',
        })
        .set(admin)
        .expect(200);
      expect(body.agrupacion).toBe('Estado');
      expect(body.grupos).toHaveLength(2);
      expect(body.filtros.map((f: { etiqueta: string }) => f.etiqueta)).toEqual([
        'Estado',
        'Nivel',
      ]);
    });

    it('el rango de fechas incluye el día final completo, en hora de Guatemala', async () => {
      await datos();
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(
        new Date(),
      );
      const conHoy = await p
        .servidor()
        .get('/reportes/solicitudes')
        .query({ desde: hoy, hasta: hoy })
        .set(admin)
        .expect(200);
      expect(conHoy.body.total).toBe(2);

      const antes = await p
        .servidor()
        .get('/reportes/solicitudes')
        .query({ hasta: '2020-01-01' })
        .set(admin)
        .expect(200);
      expect(antes.body.total).toBe(0);
    });

    it.each([
      [{ desde: '2026-10-01', hasta: '2026-09-01' }, 422, /fecha inicial/],
      [
        { convocatoriaId: '11111111-1111-4111-8111-111111111111', agruparPor: 'CONVOCATORIA' },
        422,
        /un solo grupo/,
      ],
      [{ estado: 'BORRADOR' }, 422, /no reportable/],
      [{ formato: 'XLSX' }, 422, /Formato no disponible/],
      [{ departamento: 'ATLANTIDA' }, 422, /desconocido/],
      [{ desde: '01/09/2026' }, 400, /AAAA-MM-DD/],
      [{ convocatoriaId: 'x' }, 400, /no es válida/],
    ])('rechaza %j', async (query, estado, mensaje) => {
      const { body } = await p
        .servidor()
        .get('/reportes/solicitudes')
        .query(query)
        .set(admin)
        .expect(estado);
      expect(JSON.stringify(body)).toMatch(mensaje);
    });
  });

  describe('US-030', () => {
    it('CSV descargable, con BOM', async () => {
      await datos();
      const res = await p
        .servidor()
        .get('/reportes/solicitudes')
        .query({ formato: 'CSV' })
        .set(admin)
        .buffer(true)
        .parse(binario)
        .expect(200);
      expect(res.headers['content-type']).toMatch(/^text\/csv/);
      expect(res.headers['content-disposition']).toMatch(
        /^attachment; filename="reporte-solicitudes-\d{4}-\d{2}-\d{2}\.csv"$/,
      );
      const texto = (res.body as Buffer).toString('utf8');
      expect(texto.charCodeAt(0)).toBe(0xfeff);
      expect(texto.split('\r\n').filter(Boolean)).toHaveLength(3);
    });

    it('PDF descargable', async () => {
      await datos();
      const res = await p
        .servidor()
        .get('/reportes/regiones')
        .query({ formato: 'PDF' })
        .set(admin)
        .buffer(true)
        .parse(binario)
        .expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      const pdf = res.body as Buffer;
      expect(pdf.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4');
      expect(pdf.toString('latin1')).toContain('(Becas adjudicadas por departamento) Tj');
    });
  });

  it('US-029: panel del programa', async () => {
    await datos();
    const { body } = await p.servidor().get('/reportes/panel').set(admin).expect(200);
    expect(body).toMatchObject({
      recibidas: 2,
      aprobadas: 0,
      adjudicadas: 1,
      rechazadas: 1,
      tasaAprobacion: 50,
      cuposTotales: 1,
      cuposDisponibles: 0,
      diasPromedioResolucion: 0,
    });
    expect(body.convocatorias).toHaveLength(1);
  });

  it('US-031: los 22 departamentos, con Petén al frente', async () => {
    const { convocatoriaId } = await datos();
    const { body } = await p
      .servidor()
      .get('/reportes/regiones')
      .query({ convocatoriaId })
      .set(admin)
      .expect(200);
    expect(body.total).toBe(1);
    expect(body.filas).toHaveLength(22);
    expect(body.filas[0]).toEqual({ departamento: 'Petén', becas: 1, porcentaje: 100 });
    expect(body.filtros).toContainEqual({ etiqueta: 'Departamentos sin becas', valor: '21' });
  });
});
