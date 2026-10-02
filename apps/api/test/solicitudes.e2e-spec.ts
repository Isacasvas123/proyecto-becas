/**
 * PRUEBA DE INTEGRACIÓN — EPIC-03 de punta a punta: perfil (US-011) → crear solicitud (US-012) →
 * cargar documentos (US-013) → enviar (US-014) → consultar (US-015) con su historial (US-016).
 *
 * Se montan los MÓDULOS reales (`SolicitudesModule` importa `ConvocatoriasModule` y
 * `EstudiantesModule`), los dos guards globales, el `ValidationPipe` de `main.ts` y el filtro de
 * errores. Solo se sustituyen los repositorios (en memoria), el almacenamiento (en memoria) y el
 * verificador de tokens. Así se prueba también que los módulos se hablan por sus adaptadores.
 *
 * La convocatoria se crea y publica por HTTP, como lo haría el administrador.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { CONVOCATORIA_REPOSITORIO } from '../src/modules/convocatorias/domain/ports/convocatoria.repositorio';
import { ConvocatoriaEnMemoriaRepositorio } from '../src/modules/convocatorias/infrastructure/persistence/convocatoria-en-memoria.repositorio';
import { ESTUDIANTE_REPOSITORIO } from '../src/modules/estudiantes/domain/ports/estudiante.repositorio';
import { EstudianteEnMemoriaRepositorio } from '../src/modules/estudiantes/infrastructure/persistence/estudiante-en-memoria.repositorio';
import { ALMACENAMIENTO_DOCUMENTOS } from '../src/modules/solicitudes/domain/ports/almacenamiento-documentos';
import { SOLICITUD_REPOSITORIO } from '../src/modules/solicitudes/domain/ports/solicitud.repositorio';
import { TAMANO_MAXIMO_BYTES } from '../src/modules/solicitudes/domain/value-objects/archivo-documento.vo';
import { AlmacenamientoMemoriaAdapter } from '../src/modules/solicitudes/infrastructure/almacenamiento/almacenamiento-memoria.adapter';
import { SolicitudEnMemoriaRepositorio } from '../src/modules/solicitudes/infrastructure/persistence/solicitud-en-memoria.repositorio';
import { SolicitudesModule } from '../src/modules/solicitudes/solicitudes.module';
import { RolUsuario } from '../src/modules/usuarios/domain/enums/rol-usuario.enum';
import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../src/modules/usuarios/domain/ports/verificador-token';
import { AutenticacionGuard } from '../src/modules/usuarios/presentation/guards/autenticacion.guard';
import { RolesGuard } from '../src/modules/usuarios/presentation/guards/roles.guard';
import { DominioExceptionFilter } from '../src/shared/exceptions/dominio-exception.filter';

class VerificadorFalso implements VerificadorToken {
  private readonly conocidos = new Map<string, PortadorToken>([
    [
      'token-admin',
      { usuarioId: 'admin-1', nombreUsuario: 'admin', rol: RolUsuario.ADMINISTRADOR },
    ],
    ['token-ana', { usuarioId: 'ana-1', nombreUsuario: 'ana', rol: RolUsuario.ESTUDIANTE }],
    ['token-luis', { usuarioId: 'luis-1', nombreUsuario: 'luis', rol: RolUsuario.ESTUDIANTE }],
  ]);

  verificar(token: string): Promise<PortadorToken | null> {
    return Promise.resolve(this.conocidos.get(token) ?? null);
  }
}

const admin = { Authorization: 'Bearer token-admin' };
const ana = { Authorization: 'Bearer token-ana' };
const luis = { Authorization: 'Bearer token-luis' };

const PERFIL_COMPLETO = {
  centroEducativo: 'Universidad Mariano Gálvez',
  nivel: 'UNIVERSITARIO',
  promedio: 85,
  ingresoFamiliarMensual: 4200,
  dependientes: 2,
  departamento: 'QUETZALTENANGO',
  municipio: 'Salcajá',
};

const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);

describe('Solicitudes (e2e)', () => {
  let app: INestApplication<App>;
  let almacenamiento: AlmacenamientoMemoriaAdapter;

  beforeEach(async () => {
    almacenamiento = new AlmacenamientoMemoriaAdapter();
    const modulo = await Test.createTestingModule({
      imports: [SolicitudesModule],
      providers: [
        { provide: VERIFICADOR_TOKEN, useClass: VerificadorFalso },
        { provide: APP_GUARD, useClass: AutenticacionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider(CONVOCATORIA_REPOSITORIO)
      .useValue(new ConvocatoriaEnMemoriaRepositorio([]))
      .overrideProvider(ESTUDIANTE_REPOSITORIO)
      .useValue(new EstudianteEnMemoriaRepositorio([]))
      .overrideProvider(SOLICITUD_REPOSITORIO)
      .useValue(new SolicitudEnMemoriaRepositorio([]))
      .overrideProvider(ALMACENAMIENTO_DOCUMENTOS)
      .useValue(almacenamiento)
      .compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DominioExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const servidor = () => request(app.getHttpServer());

  async function convocatoriaPublicada(): Promise<string> {
    const { body } = await servidor()
      .post('/convocatorias')
      .set(admin)
      .send({
        tipo: 'UNIVERSITARIA',
        titulo: 'Beca Universitaria 2026',
        descripcion: 'Licenciaturas en universidades del país.',
        cupos: 10,
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2099-12-31T00:00:00.000Z',
        documentosExigidos: ['DPI', 'CERTIFICADO_NOTAS'],
      })
      .expect(201);
    await servidor().post(`/convocatorias/${body.id}/publicar`).set(admin).expect(200);
    return body.id as string;
  }

  async function perfilCompleto(quien = ana) {
    await servidor().put('/estudiantes/perfil').set(quien).send(PERFIL_COMPLETO).expect(200);
  }

  async function solicitudDeAna(): Promise<string> {
    const convocatoriaId = await convocatoriaPublicada();
    await perfilCompleto();
    const { body } = await servidor()
      .post('/solicitudes')
      .set(ana)
      .send({ convocatoriaId })
      .expect(201);
    return body.id as string;
  }

  const subir = (id: string, tipo: string, contenido: Buffer, archivo: string, quien = ana) =>
    servidor()
      .put(`/solicitudes/${id}/documentos/${tipo}`)
      .set(quien)
      .attach('archivo', contenido, archivo);

  describe('perfil (US-011)', () => {
    it('vacío al inicio, con la lista de lo que falta', async () => {
      const { body } = await servidor().get('/estudiantes/perfil').set(ana).expect(200);

      expect(body.completo).toBe(false);
      expect(body.camposFaltantes).toHaveLength(7);
    });

    it('se guarda y se lee completo', async () => {
      await perfilCompleto();
      const { body } = await servidor().get('/estudiantes/perfil').set(ana).expect(200);

      expect(body).toMatchObject({ ...PERFIL_COMPLETO, completo: true, camposFaltantes: [] });
    });

    it('se puede guardar a medias', async () => {
      const { body } = await servidor()
        .put('/estudiantes/perfil')
        .set(ana)
        .send({ ...PERFIL_COMPLETO, promedio: null })
        .expect(200);

      expect(body.camposFaltantes).toEqual(['promedio']);
    });

    it.each([
      ['promedio fuera de rango', { promedio: 101 }, 400],
      ['departamento inexistente', { departamento: 'NARNIA' }, 400],
      ['campo omitido', { municipio: undefined }, 400],
      [
        'ingreso con centavos (se pide en quetzales enteros)',
        { ingresoFamiliarMensual: 10.5 },
        400,
      ],
    ])('rechaza %s', async (_caso, cambios, estado) => {
      await servidor()
        .put('/estudiantes/perfil')
        .set(ana)
        .send({ ...PERFIL_COMPLETO, ...cambios })
        .expect(estado);
    });

    it('un administrador no tiene perfil de estudiante → 403', async () => {
      await servidor().get('/estudiantes/perfil').set(admin).expect(403);
    });

    it('lista los 22 departamentos', async () => {
      const { body } = await servidor().get('/estudiantes/departamentos').set(ana).expect(200);
      expect(body).toHaveLength(22);
      expect(body).toContainEqual({ codigo: 'PETEN', nombre: 'Petén' });
    });
  });

  describe('POST /solicitudes (US-012)', () => {
    it('sin sesión → 401; como administrador → 403', async () => {
      await servidor().post('/solicitudes').send({}).expect(401);
      await servidor().get('/solicitudes').set(admin).expect(403);
    });

    it('422 con perfil incompleto, diciendo qué falta', async () => {
      const convocatoriaId = await convocatoriaPublicada();
      const { body } = await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId })
        .expect(422);

      expect(body.mensaje).toMatch(
        /^Complete su perfil antes de postular\. Falta: centro educativo/,
      );
    });

    it('201 en BORRADOR con los documentos pendientes', async () => {
      const convocatoriaId = await convocatoriaPublicada();
      await perfilCompleto();

      const { body } = await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId })
        .expect(201);

      expect(body).toMatchObject({
        numero: expect.stringMatching(/^SOL-\d{4}-000001$/),
        estado: 'BORRADOR',
        editable: true,
        convocatoria: { id: convocatoriaId, titulo: 'Beca Universitaria 2026' },
      });
      expect(body.documentos.map((d: { tipo: string }) => d.tipo)).toEqual([
        'DPI',
        'CERTIFICADO_NOTAS',
      ]);
      expect(body.documentosFaltantes).toHaveLength(2);
    });

    it('409 con una segunda solicitud a la misma convocatoria (criterio 2)', async () => {
      const convocatoriaId = await convocatoriaPublicada();
      await perfilCompleto();
      await servidor().post('/solicitudes').set(ana).send({ convocatoriaId }).expect(201);

      const { body } = await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId })
        .expect(409);
      expect(body.mensaje).toMatch(/Ya tiene una solicitud activa/);
    });

    it('422 si la convocatoria sigue en borrador (criterio 1)', async () => {
      const { body: borrador } = await servidor()
        .post('/convocatorias')
        .set(admin)
        .send({
          tipo: 'POSGRADO',
          titulo: 'Maestrías 2026',
          descripcion: 'Posgrados.',
          cupos: 5,
          fechaApertura: '2026-01-01T00:00:00.000Z',
          fechaCierre: '2099-12-31T00:00:00.000Z',
        })
        .expect(201);
      await perfilCompleto();

      await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId: borrador.id })
        .expect(422);
    });

    it('404 con una convocatoria inexistente; 400 con un id mal formado', async () => {
      await perfilCompleto();
      await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId: '11111111-1111-4111-8111-111111111111' })
        .expect(404);
      await servidor().post('/solicitudes').set(ana).send({ convocatoriaId: 'x' }).expect(400);
    });

    it('400 si se intenta mandar el estado o el estudiante', async () => {
      const convocatoriaId = await convocatoriaPublicada();
      await perfilCompleto();
      await servidor()
        .post('/solicitudes')
        .set(ana)
        .send({ convocatoriaId, estudianteId: 'luis-1' })
        .expect(400);
    });
  });

  describe('acceso a solicitudes ajenas (US-003)', () => {
    it('otro estudiante recibe 403 al ver, cargar, descargar o enviar', async () => {
      const id = await solicitudDeAna();
      await subir(id, 'DPI', PDF, 'dpi.pdf').expect(200);

      await servidor().get(`/solicitudes/${id}`).set(luis).expect(403);
      await subir(id, 'DPI', PDF, 'dpi.pdf', luis).expect(403);
      await servidor().get(`/solicitudes/${id}/documentos/DPI`).set(luis).expect(403);
      await servidor().post(`/solicitudes/${id}/enviar`).set(luis).expect(403);
    });

    it('el listado de cada quien solo trae lo suyo (US-015)', async () => {
      await solicitudDeAna();

      const deAna = await servidor().get('/solicitudes').set(ana).expect(200);
      const deLuis = await servidor().get('/solicitudes').set(luis).expect(200);
      expect(deAna.body).toHaveLength(1);
      expect(deLuis.body).toHaveLength(0);
    });

    it('404 si la solicitud no existe; 400 si el id no es válido', async () => {
      await servidor()
        .get('/solicitudes/11111111-1111-4111-8111-111111111111')
        .set(ana)
        .expect(404);
      await servidor().get('/solicitudes/abc').set(ana).expect(400);
    });
  });

  describe('PUT /solicitudes/:id/documentos/:tipo (US-013)', () => {
    it('carga, queda marcado y se puede descargar tal cual', async () => {
      const id = await solicitudDeAna();

      const { body } = await subir(id, 'DPI', PDF, 'mi dpi.pdf').expect(200);
      expect(body.documentos[0]).toMatchObject({
        tipo: 'DPI',
        cargado: true,
        nombreArchivo: 'mi dpi.pdf',
        tamanoBytes: PDF.length,
      });
      expect(body.documentosFaltantes).toHaveLength(1);

      const descarga = await servidor()
        .get(`/solicitudes/${id}/documentos/DPI`)
        .set(ana)
        .buffer(true)
        .parse((res, fin) => {
          const partes: Buffer[] = [];
          res.on('data', (c: Buffer) => partes.push(c));
          res.on('end', () => fin(null, Buffer.concat(partes)));
        })
        .expect(200);
      expect(descarga.headers['content-type']).toMatch(/^application\/pdf/);
      expect(descarga.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.compare(descarga.body as Buffer, PDF)).toBe(0);
    });

    it('reemplazar deja un solo archivo guardado (criterio 3)', async () => {
      const id = await solicitudDeAna();
      await subir(id, 'DPI', PDF, 'dpi.pdf').expect(200);
      const { body } = await subir(id, 'DPI', PNG, 'dpi.png').expect(200);

      expect(body.documentos[0].nombreArchivo).toBe('dpi.png');
      expect(almacenamiento.archivos.size).toBe(1);
    });

    it('422 con un formato no permitido, con mensaje específico (criterio 2)', async () => {
      const id = await solicitudDeAna();
      const { body } = await subir(id, 'DPI', Buffer.from('hola'), 'dpi.txt').expect(422);

      expect(body.mensaje).toBe('Formato no permitido. Solo se aceptan archivos PDF, JPG o PNG.');
    });

    it('422 con un "PDF" que no lo es', async () => {
      const id = await solicitudDeAna();
      const { body } = await subir(id, 'DPI', Buffer.from('MZ ejecutable'), 'dpi.pdf').expect(422);

      expect(body.mensaje).toMatch(/dice ser PDF/);
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('413 con más de 5 MB, con mensaje en español (criterio 2)', async () => {
      const id = await solicitudDeAna();
      const grande = Buffer.alloc(TAMANO_MAXIMO_BYTES + 1024 * 1024);
      PDF.copy(grande);

      const { body } = await subir(id, 'DPI', grande, 'grande.pdf').expect(413);
      expect(body.mensaje).toBe('El archivo supera el máximo permitido de 5 MB.');
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('422 con un tipo que la convocatoria no exige', async () => {
      const id = await solicitudDeAna();
      await subir(id, 'CARTA_RECOMENDACION', PDF, 'carta.pdf').expect(422);
    });

    it('400 sin archivo o con un tipo mal formado', async () => {
      const id = await solicitudDeAna();
      await servidor().put(`/solicitudes/${id}/documentos/DPI`).set(ana).expect(400);
      await subir(id, 'dpi', PDF, 'dpi.pdf').expect(400);
    });

    it('404 al descargar un documento que no se ha cargado', async () => {
      const id = await solicitudDeAna();
      await servidor().get(`/solicitudes/${id}/documentos/DPI`).set(ana).expect(404);
    });
  });

  describe('POST /solicitudes/:id/enviar (US-014) y seguimiento (US-015, US-016)', () => {
    it('422 si falta algo, diciendo exactamente qué (criterio 2)', async () => {
      const id = await solicitudDeAna();
      await subir(id, 'DPI', PDF, 'dpi.pdf').expect(200);

      const { body } = await servidor().post(`/solicitudes/${id}/enviar`).set(ana).expect(422);
      expect(body.mensaje).toMatch(/^No se puede enviar todavía\. Falta: documentos \(.+\)\.$/);
    });

    it('flujo completo: envía, deja de ser editable y el historial lo refleja', async () => {
      const id = await solicitudDeAna();
      await subir(id, 'DPI', PDF, 'dpi.pdf').expect(200);
      await subir(id, 'CERTIFICADO_NOTAS', PNG, 'notas.png').expect(200);

      const { body } = await servidor().post(`/solicitudes/${id}/enviar`).set(ana).expect(200);
      expect(body).toMatchObject({ estado: 'ENVIADA', editable: false, documentosFaltantes: [] });
      expect(body.enviadaEn).toEqual(expect.any(String));

      // Ya no se puede modificar ni reenviar (criterio 3).
      await subir(id, 'DPI', PDF, 'otro.pdf').expect(409);
      await servidor().post(`/solicitudes/${id}/enviar`).set(ana).expect(409);

      const { body: listado } = await servidor().get('/solicitudes').set(ana).expect(200);
      expect(listado[0]).toMatchObject({ estado: 'ENVIADA' });
      expect(listado[0].historial.map((h: { hacia: string }) => h.hacia)).toEqual([
        'BORRADOR',
        'ENVIADA',
      ]);
      // El historial no expone quién hizo el cambio: no le sirve al estudiante.
      expect(listado[0].historial[1]).not.toHaveProperty('autorId');
      // Ni la ubicación interna del archivo.
      expect(JSON.stringify(listado)).not.toContain('referencia');
    });
  });
});
