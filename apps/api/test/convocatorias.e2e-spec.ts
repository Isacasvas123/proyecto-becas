/**
 * PRUEBA DE INTEGRACIÓN — `GET /convocatorias`.
 *
 * Recorre la rebanada vertical completa: HTTP → controlador → servicio de aplicación →
 * puerto → adaptador. Todas las capas, de punta a punta.
 *
 * LA PIEZA INTERESANTE es `overrideProvider(CONVOCATORIA_REPOSITORIO)`: se sustituye el
 * adaptador de Prisma por el de memoria SIN tocar el controlador ni el servicio. Eso solo
 * es posible porque la dependencia está invertida (SOLID · D), y es lo que permite que
 * `npm run test:e2e` corra sin Docker ni PostgreSQL.
 *
 * NOTA PARA EL EQUIPO: cuando el CI tenga Postgres disponible (ver .github/workflows/ci.yml)
 * conviene añadir además una prueba de integración contra la base de datos real, que
 * ejercite el `ConvocatoriaPrismaRepositorio` de verdad. Queda pendiente.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ConvocatoriasModule } from '../src/modules/convocatorias/convocatorias.module';
import { Convocatoria } from '../src/modules/convocatorias/domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../src/modules/convocatorias/domain/enums/estado-convocatoria.enum';
import { Requisito } from '../src/modules/convocatorias/domain/enums/requisito.enum';
import { TipoBeca } from '../src/modules/convocatorias/domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../src/modules/convocatorias/domain/enums/tipo-documento.enum';
import { CONVOCATORIA_REPOSITORIO } from '../src/modules/convocatorias/domain/ports/convocatoria.repositorio';
import { PeriodoPostulacion } from '../src/modules/convocatorias/domain/value-objects/periodo-postulacion.vo';
import { ConvocatoriaEnMemoriaRepositorio } from '../src/modules/convocatorias/infrastructure/persistence/convocatoria-en-memoria.repositorio';

function enDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

function convocatoria(codigo: string, estado: EstadoConvocatoria): Convocatoria {
  return Convocatoria.reconstituir({
    id: `id-${codigo}`,
    codigo,
    titulo: `Convocatoria ${codigo}`,
    descripcion: 'Descripción de prueba.',
    tipo: TipoBeca.POSGRADO,
    estado,
    cupos: 40,
    periodo: PeriodoPostulacion.crear(enDias(-5), enDias(30)),
    requisitos: [Requisito.TITULO_UNIVERSITARIO],
    documentosExigidos: [TipoDocumento.DPI],
  });
}

describe('GET /convocatorias (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [ConvocatoriasModule] })
      .overrideProvider(CONVOCATORIA_REPOSITORIO)
      .useValue(
        new ConvocatoriaEnMemoriaRepositorio([
          convocatoria('PUB-1', EstadoConvocatoria.PUBLICADA),
          convocatoria('BOR-1', EstadoConvocatoria.BORRADOR),
        ]),
      )
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devuelve 200 y solo las convocatorias publicadas', async () => {
    const respuesta = await request(app.getHttpServer()).get('/convocatorias').expect(200);

    expect(Array.isArray(respuesta.body)).toBe(true);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0]).toMatchObject({
      codigo: 'PUB-1',
      estado: 'PUBLICADA',
      tipo: 'POSGRADO',
      cupos: 40,
    });
  });
});
