/**
 * PRUEBA DE INTEGRACIÓN — EPIC-04 de punta a punta, sobre el flujo real de EPIC-03:
 *
 *   administrador publica → estudiante postula y envía → administrador crea un evaluador y un
 *   comité → asigna → el evaluador ve lo suyo y dictamina → el administrador consolida.
 *
 * El montaje de la plataforma está en `utilidades/plataforma-de-prueba.ts` (y ahí se explica por
 * qué no se importan los módulos de evaluaciones y resoluciones directamente).
 */
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

import {
  ANA,
  OBSERVACION,
  admin,
  ana,
  montarPlataforma,
  pasos,
} from './utilidades/plataforma-de-prueba';

describe('Evaluación y comités (e2e)', () => {
  let app: INestApplication<App>;
  let p: ReturnType<typeof pasos>;

  beforeEach(async () => {
    app = await montarPlataforma();
    p = pasos(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const servidor = () => p.servidor();
  const convocatoria = () => p.convocatoria();
  const evaluador = (u: string, c: string) => p.evaluador(u, c);
  const escenario = () => p.escenario();

  describe('cuentas de evaluador (parte de US-017)', () => {
    it('el administrador las crea y las lista; nunca devuelve el hash ni el CUI', async () => {
      const eva = await evaluador('eva.ruiz', '3333333330101');
      const { body } = await servidor().get('/evaluadores').set(admin).expect(200);
      expect(body).toEqual([
        expect.objectContaining({
          id: eva.id,
          rol: 'EVALUADOR',
          nombreCompleto: 'Evaluador eva.ruiz',
        }),
      ]);
      expect(JSON.stringify(body)).not.toMatch(/hash|cui|3333/i);
    });

    it('409 con un CUI repetido; 400 si intentan mandar el rol', async () => {
      await evaluador('eva.ruiz', '3333333330101');
      await servidor()
        .post('/evaluadores')
        .set(admin)
        .send({
          nombreCompleto: 'Otra',
          cui: '3333333330101',
          correo: 'otra@mineduc.gt',
          nombreUsuario: 'otra',
          password: 'Evalua2026',
        })
        .expect(409);
      await servidor()
        .post('/evaluadores')
        .set(admin)
        .send({
          nombreCompleto: 'Otra',
          cui: '5555555550101',
          correo: 'otra@mineduc.gt',
          nombreUsuario: 'otra',
          password: 'Evalua2026',
          rol: 'ADMINISTRADOR',
        })
        .expect(400);
    });

    it('un estudiante no puede crear evaluadores', async () => {
      await servidor().get('/evaluadores').set(ana).expect(403);
    });
  });

  describe('comités (US-017)', () => {
    it('crea con criterio e integrantes; una convocatoria, un comité', async () => {
      const { convocatoriaId, eva, comiteId } = await escenario();
      const { body } = await servidor().get(`/comites/${comiteId}`).set(admin).expect(200);
      expect(body).toMatchObject({
        nombre: 'Comité universitario',
        criterio: expect.stringMatching(/^Mixto/),
        integrantes: [{ id: eva.id, asignadas: 0, dictaminadas: 0 }],
      });

      await servidor()
        .post('/comites')
        .set(admin)
        .send({ nombre: 'Otro', convocatoriaId, evaluadorIds: [eva.id] })
        .expect(409);
    });

    it('422 sin evaluadores o con un estudiante como integrante', async () => {
      const convocatoriaId = await convocatoria();
      const { id } = await evaluador('eva.ruiz', '3333333330101');
      await servidor()
        .post('/comites')
        .set(admin)
        .send({ nombre: 'Comité', convocatoriaId, evaluadorIds: [] })
        .expect(422);
      await servidor()
        .post('/comites')
        .set(admin)
        .send({ nombre: 'Comité', convocatoriaId, evaluadorIds: [id, ANA] })
        .expect(422);
    });

    it('solo administración: un evaluador recibe 403', async () => {
      const { eva } = await escenario();
      await servidor().get('/comites').set(eva.token).expect(403);
    });
  });

  describe('flujo completo (US-018 a US-021)', () => {
    it('asignar, evaluar y consolidar', async () => {
      const { solAna, solLuis, eva, beto, comiteId } = await escenario();

      // US-018: pendientes y reparto automático.
      const pendientes = await servidor()
        .get(`/comites/${comiteId}/por-asignar`)
        .set(admin)
        .expect(200);
      expect(pendientes.body.map((s: { id: string }) => s.id).sort()).toEqual(
        [solAna, solLuis].sort(),
      );

      const { body: reparto } = await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'AUTOMATICO', porSolicitud: 1 })
        .expect(200);
      expect(reparto).toEqual({ solicitudes: 2, asignaciones: 2 });

      // La estudiante ve el cambio en su historial.
      const { body: suya } = await servidor().get(`/solicitudes/${solAna}`).set(ana).expect(200);
      expect(suya.estado).toBe('EN_EVALUACION');
      expect(suya.historial.map((h: { hacia: string }) => h.hacia)).toEqual([
        'BORRADOR',
        'ENVIADA',
        'EN_EVALUACION',
      ]);

      // US-020: el evaluador ve solo lo suyo; otro evaluador, nada.
      const { body: asignadas } = await servidor()
        .get('/evaluaciones/asignadas')
        .set(eva.token)
        .expect(200);
      expect(asignadas).toHaveLength(2);
      expect(asignadas.every((a: { dictaminada: boolean }) => !a.dictaminada)).toBe(true);
      const { body: deBeto } = await servidor()
        .get('/evaluaciones/asignadas')
        .set(beto.token)
        .expect(200);
      expect(deBeto).toEqual([]);

      // CU-10, 1a: Beto no puede ver, descargar ni dictaminar.
      await servidor().get(`/evaluaciones/solicitudes/${solAna}`).set(beto.token).expect(403);
      await servidor()
        .get(`/evaluaciones/solicitudes/${solAna}/documentos/DPI`)
        .set(beto.token)
        .expect(403);
      await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(beto.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
        .expect(403);

      // US-019, criterio 1: datos y documentos.
      const { body: expediente } = await servidor()
        .get(`/evaluaciones/solicitudes/${solAna}`)
        .set(eva.token)
        .expect(200);
      expect(expediente).toMatchObject({
        estado: 'EN_EVALUACION',
        solicitante: { nombreCompleto: 'Ana López', promedio: 80, departamento: 'PETEN' },
        // 80 × 0.6 + 50 × 0.4: Q5,500 entre 2 = Q2,750 por persona, la mitad del tramo.
        calculo: { puntaje: 68 },
        puedeDictaminar: true,
        dictamen: null,
      });
      expect(JSON.stringify(expediente)).not.toContain('referencia');

      const descarga = await servidor()
        .get(`/evaluaciones/solicitudes/${solAna}/documentos/DPI`)
        .set(eva.token)
        .expect(200);
      expect(descarga.headers['content-type']).toMatch(/^application\/pdf/);

      // Criterios 3 y 4.
      await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: 'corta' })
        .expect(422);
      await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'QUIZAS', observacion: OBSERVACION })
        .expect(400);
      // El puntaje no lo manda el evaluador.
      await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION, puntaje: 100 })
        .expect(400);

      const { body: dictamen } = await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
        .expect(201);
      expect(dictamen).toMatchObject({ puntaje: 68, recomendacion: 'FAVORABLE' });

      await servidor()
        .post(`/evaluaciones/solicitudes/${solAna}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'DESFAVORABLE', observacion: OBSERVACION })
        .expect(409);

      await servidor()
        .post(`/evaluaciones/solicitudes/${solLuis}/dictamen`)
        .set(eva.token)
        .send({ recomendacion: 'FAVORABLE', observacion: OBSERVACION })
        .expect(201);

      // US-021.
      const { body: consolidado } = await servidor()
        .get(`/comites/${comiteId}/consolidado`)
        .set(admin)
        .expect(200);
      expect(consolidado).toMatchObject({ cupos: 1, completas: 2 });
      expect(
        consolidado.filas.map(
          (f: { estudiante: string; posicion: number; dentroDeCupos: boolean }) => [
            f.estudiante,
            f.posicion,
            f.dentroDeCupos,
          ],
        ),
      ).toEqual([
        ['Luis Cac', 1, true],
        ['Ana López', 2, false],
      ]);

      const { body: comite } = await servidor().get(`/comites/${comiteId}`).set(admin).expect(200);
      expect(comite.integrantes[0]).toMatchObject({ asignadas: 2, dictaminadas: 2 });
    });

    it('asignación manual y sus rechazos', async () => {
      const { solAna, eva, beto, comiteId } = await escenario();

      await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'MANUAL', asignaciones: [{ solicitudId: solAna, evaluadorIds: [beto.id] }] })
        .expect(422);
      await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'MANUAL', asignaciones: [{ solicitudId: solAna, evaluadorIds: [] }] })
        .expect(400);
      await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'AUTOMATICO', porSolicitud: 2 })
        .expect(422);

      await servidor()
        .post(`/comites/${comiteId}/evaluadores`)
        .set(admin)
        .send({ evaluadorIds: [beto.id] })
        .expect(200);
      await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({
          modo: 'MANUAL',
          asignaciones: [{ solicitudId: solAna, evaluadorIds: [eva.id, beto.id] }],
        })
        .expect(200);

      // Ya no está ENVIADA: no se puede volver a asignar.
      await servidor()
        .post(`/comites/${comiteId}/asignaciones`)
        .set(admin)
        .send({ modo: 'MANUAL', asignaciones: [{ solicitudId: solAna, evaluadorIds: [eva.id] }] })
        .expect(422);

      const { body } = await servidor().get('/evaluaciones/asignadas').set(beto.token).expect(200);
      expect(body.map((a: { solicitudId: string }) => a.solicitudId)).toEqual([solAna]);
    });
  });
});
