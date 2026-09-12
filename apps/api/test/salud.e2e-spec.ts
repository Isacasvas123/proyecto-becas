/**
 * PRUEBA DE INTEGRACIÓN — `GET /health`.
 *
 * Levanta la aplicación de Nest en memoria y hace una petición HTTP real con Supertest.
 * No necesita base de datos: `SaludModule` no depende de Prisma.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { SaludModule } from '../src/modules/salud/salud.module';

describe('GET /health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [SaludModule] }).compile();
    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 con status "ok" y una marca de tiempo ISO-8601', async () => {
    const respuesta = await request(app.getHttpServer()).get('/health').expect(200);

    expect(respuesta.body.status).toBe('ok');
    expect(new Date(respuesta.body.timestamp).toISOString()).toBe(respuesta.body.timestamp);
  });
});
