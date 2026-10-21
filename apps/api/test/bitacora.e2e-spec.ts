/**
 * PRUEBA DE INTEGRACIÓN — bitácora (exigencia del Product Owner, 17 de octubre de 2026).
 *
 * Lo que se comprueba aquí no se puede comprobar con pruebas unitarias: que el interceptor esté
 * **registrado de forma global** y escriba solo, sin que ningún controlador lo llame. Si alguien
 * lo quitara del módulo, estas pruebas fallan aunque el servicio siga perfecto.
 */
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

import {
  ANA,
  CUI_ANA,
  admin,
  ana,
  montarPlataforma,
  pasos,
} from './utilidades/plataforma-de-prueba';

describe('Bitácora (e2e)', () => {
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
  const leerBitacora = async (consulta = '') => {
    const { body } = await servidor().get(`/bitacora${consulta}`).set(admin).expect(200);
    return body as {
      total: number;
      paginas: number;
      registros: {
        actor: string | null;
        rol: string | null;
        accion: string;
        entidad: string | null;
        resultado: number;
        rechazada: boolean;
      }[];
    };
  };

  it('registra sola cualquier acción que cambia algo, con su autor y su resultado', async () => {
    await p.convocatoria();

    const { registros } = await leerBitacora('?entidad=convocatorias');
    const creacion = registros.find((r) => r.accion === 'POST /convocatorias');

    expect(creacion).toMatchObject({
      rol: 'ADMINISTRADOR',
      entidad: 'convocatorias',
      resultado: 201,
      rechazada: false,
    });
  });

  it('las lecturas no se registran: una bitácora llena de GET no sirve para nada', async () => {
    await servidor().get('/convocatorias').expect(200);

    const { registros } = await leerBitacora();
    expect(registros.some((r) => r.accion === 'GET /convocatorias')).toBe(false);
  });

  it('también registra lo que se rechaza, que es lo que más interesa auditar', async () => {
    await servidor()
      .post('/convocatorias')
      .set(ana)
      .send({ nombre: 'intento', convocatoriaId: 'x' })
      .expect(403);

    const { registros } = await leerBitacora('?soloRechazadas=true');

    expect(registros[0]).toMatchObject({
      actor: ANA,
      rol: 'ESTUDIANTE',
      accion: 'POST /convocatorias',
      resultado: 403,
      rechazada: true,
    });
  });

  it('agrupa por acción: los identificadores de la ruta no dispersan el registro', async () => {
    // Una convocatoria sin publicar: `p.convocatoria()` ya la publica, y publicar dos veces da 409.
    const { body } = await servidor()
      .post('/convocatorias')
      .set(admin)
      .send({
        tipo: 'UNIVERSITARIA',
        titulo: 'Beca para la prueba de bitácora',
        descripcion: 'Creada sin publicar, para auditar la publicación.',
        cupos: 3,
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2099-12-31T00:00:00.000Z',
        documentosExigidos: ['DPI'],
      })
      .expect(201);
    await servidor().post(`/convocatorias/${body.id}/publicar`).set(admin).expect(200);

    const { registros } = await leerBitacora();
    const publicacion = registros.find((r) => r.accion.includes('publicar'));

    expect(publicacion?.accion).toBe('POST /convocatorias/:id/publicar');
  });

  it('no guarda el cuerpo de la petición: ahí viajan el CUI y las contraseñas', async () => {
    await p.enviar(ana, await p.convocatoria());

    const { registros } = await leerBitacora('?porPagina=100');
    const todo = JSON.stringify(registros);

    expect(todo).not.toContain(CUI_ANA);
  });

  it('consultar la bitácora queda registrado en la bitácora', async () => {
    await leerBitacora();

    const { registros } = await leerBitacora();
    expect(registros.some((r) => r.accion === 'GET /bitacora')).toBe(true);
  });

  it('solo administración: un estudiante recibe 403', async () => {
    await servidor().get('/bitacora').set(ana).expect(403);
  });

  it('pagina y respeta el tope de 100 por página', async () => {
    for (let i = 0; i < 3; i += 1) await p.convocatoria();

    const porPagina = await leerBitacora('?porPagina=2');
    expect(porPagina.registros).toHaveLength(2);
    expect(porPagina.paginas).toBeGreaterThan(1);

    await servidor().get('/bitacora?porPagina=5000').set(admin).expect(400);
  });

  it('rechaza un filtro de fecha mal escrito en vez de ignorarlo', async () => {
    await servidor().get('/bitacora?desde=17-10-2026').set(admin).expect(400);
  });
});
