/**
 * PRUEBA DE INTEGRACIÓN — gestión de convocatorias (US-006 y US-007).
 *
 * A diferencia de `convocatorias.e2e-spec.ts`, aquí se montan los DOS guards globales reales
 * (`AutenticacionGuard` y `RolesGuard`), el `ValidationPipe` con la misma configuración que
 * `main.ts` y el filtro de excepciones del dominio. Es la pila HTTP completa de producción,
 * salvo dos sustituciones: el repositorio es el de memoria y el verificador de tokens es un
 * doble que reconoce dos tokens fijos.
 *
 * Así se comprueba lo que una prueba unitaria no puede: que las rutas de administración
 * EXIGEN el rol, que un error de dominio sale con el código HTTP correcto, y que la ruta
 * pública sigue abierta.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ConvocatoriasModule } from '../src/modules/convocatorias/convocatorias.module';
import { CONVOCATORIA_REPOSITORIO } from '../src/modules/convocatorias/domain/ports/convocatoria.repositorio';
import { ConvocatoriaEnMemoriaRepositorio } from '../src/modules/convocatorias/infrastructure/persistence/convocatoria-en-memoria.repositorio';
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
    ['token-admin', { usuarioId: '1', nombreUsuario: 'admin', rol: RolUsuario.ADMINISTRADOR }],
    ['token-estudiante', { usuarioId: '2', nombreUsuario: 'ana', rol: RolUsuario.ESTUDIANTE }],
  ]);

  verificar(token: string): Promise<PortadorToken | null> {
    return Promise.resolve(this.conocidos.get(token) ?? null);
  }
}

const admin = { Authorization: 'Bearer token-admin' };
const estudiante = { Authorization: 'Bearer token-estudiante' };

function cuerpo(cambios: Record<string, unknown> = {}) {
  return {
    tipo: 'UNIVERSITARIA',
    titulo: 'Beca Universitaria 2026',
    descripcion: 'Licenciaturas en universidades del país.',
    cupos: 150,
    fechaApertura: '2026-01-01T00:00:00.000Z',
    // Cierre lejano para que, una vez publicada, sea visible en cualquier fecha de ejecución.
    fechaCierre: '2099-12-31T00:00:00.000Z',
    ...cambios,
  };
}

describe('Gestión de convocatorias (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConvocatoriasModule],
      providers: [
        { provide: VERIFICADOR_TOKEN, useClass: VerificadorFalso },
        { provide: APP_GUARD, useClass: AutenticacionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider(CONVOCATORIA_REPOSITORIO)
      .useValue(new ConvocatoriaEnMemoriaRepositorio([]))
      .compile();

    app = modulo.createNestApplication();
    // Misma configuración que main.ts: si difiriera, esta prueba no diría nada de producción.
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

  describe('control de acceso', () => {
    it('crear sin sesión → 401', async () => {
      await servidor().post('/convocatorias').send(cuerpo()).expect(401);
    });

    it('crear con rol ESTUDIANTE → 403, y no se crea nada', async () => {
      await servidor().post('/convocatorias').set(estudiante).send(cuerpo()).expect(403);

      const { body } = await servidor().get('/convocatorias/gestion').set(admin).expect(200);
      expect(body).toHaveLength(0);
    });

    it.each([
      ['GET', '/convocatorias/gestion'],
      ['GET', '/convocatorias/catalogo'],
      ['POST', '/convocatorias/11111111-1111-4111-8111-111111111111/publicar'],
    ])('%s %s con rol ESTUDIANTE → 403', async (metodo, ruta) => {
      const peticion = metodo === 'GET' ? servidor().get(ruta) : servidor().post(ruta);
      await peticion.set(estudiante).expect(403);
    });

    it('el listado público sigue abierto sin sesión (US-008)', async () => {
      await servidor().get('/convocatorias').expect(200);
    });
  });

  describe('POST /convocatorias (US-006)', () => {
    it('201: nace en BORRADOR, con código correlativo y los requisitos del tipo', async () => {
      const { body } = await servidor()
        .post('/convocatorias')
        .set(admin)
        .send(cuerpo())
        .expect(201);

      expect(body.estado).toBe('BORRADOR');
      expect(body.codigo).toBe('UNIV-2026-001');
      expect(body.requisitos.length).toBeGreaterThan(0);
      expect(body.requisitos[0]).toEqual({
        codigo: expect.any(String),
        descripcion: expect.any(String),
      });
    });

    it('recién creada NO aparece en el listado público (criterio 4)', async () => {
      await servidor().post('/convocatorias').set(admin).send(cuerpo()).expect(201);

      const { body } = await servidor().get('/convocatorias').expect(200);
      expect(body).toHaveLength(0);
    });

    it('422 si el cierre no es posterior a la apertura (criterio 2)', async () => {
      const { body } = await servidor()
        .post('/convocatorias')
        .set(admin)
        .send(
          cuerpo({
            fechaApertura: '2026-12-01T00:00:00.000Z',
            fechaCierre: '2026-11-01T00:00:00.000Z',
          }),
        )
        .expect(422);

      expect(body.mensaje).toMatch(/cierre debe ser posterior/);
    });

    it('422 si posgrado supera su tope de cupos: la regla de la fábrica llega hasta HTTP', async () => {
      await servidor()
        .post('/convocatorias')
        .set(admin)
        .send(cuerpo({ tipo: 'POSGRADO', cupos: 51 }))
        .expect(422);
    });

    it.each([
      ['cupos en cero (criterio 3)', { cupos: 0 }],
      ['cupos decimales', { cupos: 2.5 }],
      ['tipo inexistente', { tipo: 'TECNICA' }],
      ['requisito fuera del catálogo', { requisitos: ['SABER_NADAR'] }],
      ['fecha inválida', { fechaApertura: 'mañana' }],
      ['título vacío', { titulo: '' }],
    ])('400 con %s', async (_caso, cambios) => {
      await servidor().post('/convocatorias').set(admin).send(cuerpo(cambios)).expect(400);
    });

    it('400 si se intenta mandar el ESTADO: una convocatoria no puede nacer publicada', async () => {
      // `forbidNonWhitelisted` rechaza el campo en lugar de ignorarlo en silencio.
      await servidor()
        .post('/convocatorias')
        .set(admin)
        .send(cuerpo({ estado: 'PUBLICADA' }))
        .expect(400);
    });
  });

  describe('POST /convocatorias/:id/publicar (US-007)', () => {
    async function crearBorrador(cambios: Record<string, unknown> = {}): Promise<string> {
      const { body } = await servidor()
        .post('/convocatorias')
        .set(admin)
        .send(cuerpo(cambios))
        .expect(201);
      return body.id as string;
    }

    it('200: pasa a PUBLICADA y aparece en el listado público (criterio 2)', async () => {
      const id = await crearBorrador();

      const { body } = await servidor()
        .post(`/convocatorias/${id}/publicar`)
        .set(admin)
        .expect(200);
      expect(body.estado).toBe('PUBLICADA');

      const publico = await servidor().get('/convocatorias').expect(200);
      expect(publico.body.map((c: { id: string }) => c.id)).toContain(id);
    });

    it('409 al publicar dos veces: el problema es el estado, no los datos', async () => {
      const id = await crearBorrador();
      await servidor().post(`/convocatorias/${id}/publicar`).set(admin).expect(200);

      await servidor().post(`/convocatorias/${id}/publicar`).set(admin).expect(409);
    });

    it('422 al publicar un borrador sin requisitos (criterio 1)', async () => {
      const id = await crearBorrador({ requisitos: [] });

      await servidor().post(`/convocatorias/${id}/publicar`).set(admin).expect(422);
    });

    it('404 si la convocatoria no existe', async () => {
      await servidor()
        .post('/convocatorias/44444444-4444-4444-8444-444444444444/publicar')
        .set(admin)
        .expect(404);
    });

    it('400 si el id no es un UUID, sin llegar a consultar', async () => {
      await servidor().post('/convocatorias/no-es-un-uuid/publicar').set(admin).expect(400);
    });
  });

  describe('GET /convocatorias/catalogo', () => {
    it('trae los tres tipos con sus valores por defecto', async () => {
      const { body } = await servidor().get('/convocatorias/catalogo').set(admin).expect(200);

      expect(body.tipos.map((t: { tipo: string }) => t.tipo).sort()).toEqual([
        'NIVEL_MEDIO',
        'POSGRADO',
        'UNIVERSITARIA',
      ]);
      expect(body.requisitos.length).toBeGreaterThan(0);
      expect(body.documentos.length).toBeGreaterThan(0);
    });
  });
});
