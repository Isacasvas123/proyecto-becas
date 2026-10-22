/**
 * PRUEBA DE INTEGRACIÓN — EPIC-05 sobre el flujo real completo:
 *
 *   convocatoria con 1 cupo → dos estudiantes envían → comité asigna → dictámenes →
 *   el administrador aprueba a uno (US-023), el segundo ya no cabe, rechaza al segundo →
 *   adjudica al primero (US-024) → la estudiante ve su beca → cualquiera consulta el estado
 *   con número y CUI (US-025).
 */
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

import { RolUsuario } from '../src/modules/usuarios/domain/enums/rol-usuario.enum';
import {
  CUI_ANA,
  OBSERVACION,
  admin,
  ana,
  luis,
  montarPlataforma,
  otroAdmin,
  pasos,
  sesion,
} from './utilidades/plataforma-de-prueba';

const MOTIVO = 'Puntaje dentro de los cupos y dictamen favorable.';

describe('Resolución, adjudicación y consulta pública (e2e)', () => {
  let app: INestApplication<App>;
  let p: ReturnType<typeof pasos>;

  beforeEach(async () => {
    app = await montarPlataforma();
    p = pasos(app);
  });

  afterEach(async () => {
    await app.close();
  });

  /** Escenario con las dos solicitudes asignadas a Eva y, si se pide, con su dictamen. */
  async function evaluadas({ dictaminar = true } = {}) {
    const e = await p.escenario(1);
    await p
      .servidor()
      .post(`/comites/${e.comiteId}/asignaciones`)
      .set(admin)
      .send({ modo: 'AUTOMATICO', porSolicitud: 1 })
      .expect(200);
    if (dictaminar) {
      for (const id of [e.solAna, e.solLuis]) {
        await p
          .servidor()
          .post(`/evaluaciones/solicitudes/${id}/dictamen`)
          .set(e.eva.token)
          .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
          .expect(201);
      }
    }
    return e;
  }

  const resolver = (id: string, cuerpo: object, quien: Record<string, string> = admin) =>
    p.servidor().post(`/resoluciones/solicitudes/${id}`).set(quien).send(cuerpo);

  describe('control de acceso', () => {
    it('resolver, adjudicar y ver cupos: solo administración', async () => {
      const { solAna, convocatoriaId, eva } = await evaluadas();
      for (const quien of [ana, eva.token]) {
        await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }, quien).expect(403);
        await p
          .servidor()
          .post(`/resoluciones/solicitudes/${solAna}/adjudicar`)
          .set(quien)
          .expect(403);
        await p
          .servidor()
          .get(`/resoluciones/convocatorias/${convocatoriaId}/cupos`)
          .set(quien)
          .expect(403);
      }
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }, {}).expect(401);
    });
  });

  describe('US-023 y US-024', () => {
    it('flujo completo con un solo cupo', async () => {
      const { solAna, solLuis, convocatoriaId } = await evaluadas();

      // Aprobar ocupa el cupo.
      const { body: aprobada } = await resolver(solAna, {
        decision: 'APROBAR',
        motivo: MOTIVO,
      }).expect(200);
      expect(aprobada).toMatchObject({
        estado: 'APROBADA',
        cupos: { cupos: 1, aprobadas: 1, adjudicadas: 0, disponibles: 0 },
      });

      // Criterio 4: el segundo ya no cabe.
      const { body: sinCupo } = await resolver(solLuis, {
        decision: 'APROBAR',
        motivo: MOTIVO,
      }).expect(422);
      expect(sinCupo.mensaje).toMatch(/ya no tiene cupos disponibles/);

      // Rechazar no necesita cupo; el motivo queda en el historial que ve el estudiante.
      await resolver(solLuis, {
        decision: 'RECHAZAR',
        motivo: 'Se agotaron los cupos de la convocatoria.',
      }).expect(200);
      const { body: deLuis } = await p
        .servidor()
        .get(`/solicitudes/${solLuis}`)
        .set(luis)
        .expect(200);
      expect(deLuis.estado).toBe('RECHAZADA');
      expect(deLuis.historial.at(-1)).toMatchObject({
        hacia: 'RECHAZADA',
        motivo: 'Se agotaron los cupos de la convocatoria.',
      });

      // No se resuelve dos veces.
      await resolver(solAna, { decision: 'RECHAZAR', motivo: MOTIVO }).expect(409);

      // US-024.
      const { body: adjudicada } = await p
        .servidor()
        .post(`/resoluciones/solicitudes/${solAna}/adjudicar`)
        .set(admin)
        .expect(200);
      expect(adjudicada).toMatchObject({
        estado: 'ADJUDICADA',
        beca: { codigo: expect.stringMatching(/^BECA-\d{4}-000001$/) },
        cupos: { aprobadas: 0, adjudicadas: 1, disponibles: 0 },
      });
      await p
        .servidor()
        .post(`/resoluciones/solicitudes/${solAna}/adjudicar`)
        .set(admin)
        .expect(409);
      await p
        .servidor()
        .post(`/resoluciones/solicitudes/${solLuis}/adjudicar`)
        .set(admin)
        .expect(409);

      // La estudiante ve su beca y el ciclo completo.
      const { body: deAna } = await p.servidor().get(`/solicitudes/${solAna}`).set(ana).expect(200);
      expect(deAna.beca).toEqual({
        codigo: adjudicada.beca.codigo,
        otorgadaEn: expect.any(String),
      });
      expect(deAna.historial.map((h: { hacia: string }) => h.hacia)).toEqual([
        'BORRADOR',
        'ENVIADA',
        'EN_EVALUACION',
        'APROBADA',
        'ADJUDICADA',
      ]);

      const { body: cupos } = await p
        .servidor()
        .get(`/resoluciones/convocatorias/${convocatoriaId}/cupos`)
        .set(admin)
        .expect(200);
      expect(cupos).toEqual({
        convocatoriaId,
        cupos: 1,
        aprobadas: 0,
        adjudicadas: 1,
        disponibles: 0,
      });
    });

    it('422 sin dictámenes (criterio 1)', async () => {
      const { solAna } = await evaluadas({ dictaminar: false });
      const { body } = await resolver(solAna, { decision: 'RECHAZAR', motivo: MOTIVO }).expect(422);
      expect(body.mensaje).toMatch(/no tiene ningún dictamen/);
    });

    it.each([
      ['sin motivo', { decision: 'APROBAR' }, 400],
      ['motivo demasiado corto', { decision: 'RECHAZAR', motivo: 'no' }, 422],
      ['decisión inexistente', { decision: 'TAL_VEZ', motivo: MOTIVO }, 400],
      ['un campo de más', { decision: 'APROBAR', motivo: MOTIVO, cupos: 99 }, 400],
    ])('rechaza %s (criterio 2)', async (_caso, cuerpo, estado) => {
      const { solAna } = await evaluadas();
      await resolver(solAna, cuerpo).expect(estado);
    });

    it('una solicitud enviada y sin evaluar no se resuelve; una inexistente es 404', async () => {
      const convocatoriaId = await p.convocatoria();
      const id = await p.enviar(ana, convocatoriaId);
      await resolver(id, { decision: 'APROBAR', motivo: MOTIVO }).expect(422);
      await resolver('11111111-1111-4111-8111-111111111111', {
        decision: 'APROBAR',
        motivo: MOTIVO,
      }).expect(404);
    });
  });

  describe('segunda aprobación por monto (PO, 17 Oct 2026)', () => {
    /** Escenario igual al de siempre, pero con una beca de Q25,000: pasa del umbral. */
    async function becaGrande() {
      const e = await p.escenario(1, 25_000);
      await p
        .servidor()
        .post(`/comites/${e.comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'AUTOMATICO', porSolicitud: 1 })
        .expect(200);
      await p
        .servidor()
        .post(`/evaluaciones/solicitudes/${e.solAna}/dictamen`)
        .set(e.eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
        .expect(201);
      return e;
    }

    const confirmar = (id: string, sesion: Record<string, string>) =>
      p
        .servidor()
        .post(`/resoluciones/solicitudes/${id}/confirmar-aprobacion`)
        .set(sesion)
        .send({ motivo: MOTIVO });

    it('aprobar una beca grande NO la deja aprobada: queda esperando la segunda firma', async () => {
      const { solAna } = await becaGrande();

      const { body } = await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      expect(body.estado).toBe('APROBACION_PENDIENTE');
      // Y todavia no ocupa cupo: el cupo se reserva con la segunda firma.
      expect(body.cupos).toMatchObject({ aprobadas: 0, adjudicadas: 0, disponibles: 1 });
    });

    it('el mismo administrador no puede dar la segunda firma', async () => {
      const { solAna } = await becaGrande();
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      const { body } = await confirmar(solAna, admin).expect(422);

      expect(body.mensaje).toMatch(/persona distinta/i);
    });

    it('otro administrador sí: la aprueba y ahí se reserva el cupo', async () => {
      const { solAna } = await becaGrande();
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      const { body } = await confirmar(solAna, otroAdmin).expect(200);

      expect(body.estado).toBe('APROBADA');
      expect(body.cupos).toMatchObject({ aprobadas: 1, disponibles: 0 });
    });

    it('las dos firmas quedan en el historial, con su autor', async () => {
      const { solAna } = await becaGrande();
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);
      await confirmar(solAna, otroAdmin).expect(200);

      const { body } = await p.servidor().get(`/solicitudes/${solAna}`).set(ana).expect(200);
      const hacia = body.historial.map((h: { hacia: string }) => h.hacia);

      expect(hacia).toEqual(expect.arrayContaining(['APROBACION_PENDIENTE', 'APROBADA']));
    });

    it('una beca por debajo del umbral sigue aprobandose con una sola firma', async () => {
      const { solAna } = await evaluadas();

      const { body } = await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      expect(body.estado).toBe('APROBADA');
    });

    it('no se adjudica mientras espera la segunda firma', async () => {
      const { solAna } = await becaGrande();
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      await p
        .servidor()
        .post(`/resoluciones/solicitudes/${solAna}/adjudicar`)
        .set(admin)
        .expect(409);
    });

    it('quien da la segunda firma también puede rechazarla', async () => {
      const { solAna } = await becaGrande();
      await resolver(solAna, { decision: 'APROBAR', motivo: MOTIVO }).expect(200);

      const { body } = await p
        .servidor()
        .post(`/resoluciones/solicitudes/${solAna}`)
        .set(otroAdmin)
        .send({ decision: 'RECHAZAR', motivo: MOTIVO })
        .expect(200);

      expect(body.estado).toBe('RECHAZADA');
    });
  });

  describe('US-025 consulta pública', () => {
    const consultar = (cuerpo: object) => p.servidor().post('/consulta-publica').send(cuerpo);

    async function numeroDeAna() {
      const { solAna } = await evaluadas();
      const { body } = await p.servidor().get(`/solicitudes/${solAna}`).set(ana).expect(200);
      return body.numero as string;
    }

    it('sin sesión: solo el estado y la fecha del último cambio', async () => {
      const numero = await numeroDeAna();
      const { body } = await consultar({
        numero: numero.toLowerCase(),
        cui: '1111 11111 0101',
      }).expect(200);

      expect(body).toEqual({ numero, estado: 'EN_EVALUACION', ultimoCambio: expect.any(String) });
      expect(Object.keys(body)).toHaveLength(3);
    });

    it('el mismo 404 genérico para CUI ajeno y para número inexistente', async () => {
      const numero = await numeroDeAna();
      const conCuiAjeno = await consultar({ numero, cui: '2222222220101' }).expect(404);
      const inexistente = await consultar({ numero: 'SOL-2026-999999', cui: CUI_ANA }).expect(404);
      expect(conCuiAjeno.body.mensaje).toBe(inexistente.body.mensaje);
      expect(conCuiAjeno.body.mensaje).toMatch(
        /No encontramos una solicitud con ese número y ese CUI/,
      );
    });

    it('400 con un número mal formado o sin CUI; el CUI no se acepta por la URL', async () => {
      await consultar({ numero: '123', cui: CUI_ANA }).expect(400);
      await consultar({ numero: 'SOL-2026-000001' }).expect(400);
      await p.servidor().get(`/consulta-publica?numero=SOL-2026-000001&cui=${CUI_ANA}`).expect(404);
    });

    it('frena con 429 después de 10 consultas seguidas', async () => {
      for (let i = 0; i < 10; i++) {
        await consultar({ numero: 'SOL-2026-999999', cui: CUI_ANA }).expect(404);
      }
      const { body } = await consultar({ numero: 'SOL-2026-999999', cui: CUI_ANA }).expect(429);
      expect(body.mensaje).toMatch(/demasiadas consultas/);
    });

    it('con sesión también funciona: no depende de quién pregunta', async () => {
      const numero = await numeroDeAna();
      await p
        .servidor()
        .post('/consulta-publica')
        .set(sesion('otro', RolUsuario.EVALUADOR))
        .send({ numero, cui: CUI_ANA })
        .expect(200);
    });
  });
});
