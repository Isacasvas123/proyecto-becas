/**
 * PRUEBAS DE INTEGRACIÓN — diagnóstico: `GET /health` y `GET /ready`.
 *
 * Levantan la aplicación de Nest en memoria y hacen peticiones HTTP reales con Supertest.
 *
 * `PrismaService` se sustituye por un doble, así que estas pruebas corren sin Docker ni
 * PostgreSQL. Eso permite además lo importante: **simular que la base de datos está caída**
 * sin apagar nada, que es justo el escenario que el defecto anterior no cubría.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { SaludModule } from '../src/modules/salud/salud.module';
import { PrismaService } from '../src/shared/persistence/prisma.service';

/** Doble de PrismaService cuya consulta se puede hacer fallar a voluntad. */
class PrismaFalso {
  responde = true;

  $queryRaw(): Promise<unknown> {
    return this.responde
      ? Promise.resolve([{ '?column?': 1 }])
      : Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:5432'));
  }
}

describe('Endpoints de diagnóstico (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaFalso;

  beforeAll(async () => {
    prisma = new PrismaFalso();

    const modulo = await Test.createTestingModule({ imports: [SaludModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.responde = true;
  });

  describe('GET /health — liveness', () => {
    it('responde 200 con status "ok" y una marca de tiempo ISO-8601', async () => {
      const respuesta = await request(app.getHttpServer()).get('/health').expect(200);

      expect(respuesta.body.status).toBe('ok');
      expect(new Date(respuesta.body.timestamp).toISOString()).toBe(respuesta.body.timestamp);
    });

    it('sigue respondiendo 200 aunque la base de datos esté caída', async () => {
      // No es un descuido: liveness responde si el PROCESO vive. Si consultara la base de
      // datos, un fallo de PostgreSQL provocaría reinicios en bucle que no arreglarían nada,
      // porque el problema está fuera del proceso.
      prisma.responde = false;

      await request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('GET /ready — readiness', () => {
    it('responde 200 y declara la base de datos arriba cuando responde', async () => {
      const respuesta = await request(app.getHttpServer()).get('/ready').expect(200);

      expect(respuesta.body.status).toBe('listo');
      expect(respuesta.body.dependencias.baseDatos).toBe('arriba');
    });

    it('responde 503 cuando la base de datos no responde', async () => {
      // ESTA ES LA PRUEBA QUE DOCUMENTA EL DEFECTO CORREGIDO. Antes el diagnóstico devolvía
      // 200 con el sistema inservible, y el orquestador daba el servicio por sano.
      prisma.responde = false;

      const respuesta = await request(app.getHttpServer()).get('/ready').expect(503);

      expect(respuesta.body.status).toBe('no_listo');
      expect(respuesta.body.dependencias.baseDatos).toBe('abajo');
    });

    it('no filtra detalles internos del fallo al cliente', async () => {
      prisma.responde = false;

      const respuesta = await request(app.getHttpServer()).get('/ready').expect(503);

      // El motivo real —cadena de conexión, host, puerto— se registra en el log del
      // servidor, nunca en la respuesta.
      expect(JSON.stringify(respuesta.body)).not.toContain('ECONNREFUSED');
      expect(JSON.stringify(respuesta.body)).not.toContain('5432');
    });
  });
});
