/**
 * PRUEBA DE INTEGRACIÓN — EPIC-04 de punta a punta, sobre el flujo real de EPIC-03:
 *
 *   administrador publica → estudiante postula y envía → administrador crea un evaluador y un
 *   comité → asigna → el evaluador ve lo suyo y dictamina → el administrador consolida.
 *
 * POR QUÉ NO SE IMPORTA `EvaluacionesModule`
 *   Ese módulo importa `UsuariosModule`, que importa `@nestjs/jwt`, y en esta rama Jest todavía no
 *   puede cargar esa biblioteca (solo ESM; lo corrige el PR #12). Aquí se arma el mismo grafo con
 *   los mismos controladores, servicios y adaptadores, y un módulo de cuentas de prueba con el caso
 *   de uso real de cuentas de evaluador y bcrypt real. Lo único sustituido: repositorios en
 *   memoria, almacenamiento en memoria y el verificador de tokens.
 */
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ConvocatoriasModule } from '../src/modules/convocatorias/convocatorias.module';
import { CONVOCATORIA_REPOSITORIO } from '../src/modules/convocatorias/domain/ports/convocatoria.repositorio';
import { ConvocatoriaEnMemoriaRepositorio } from '../src/modules/convocatorias/infrastructure/persistence/convocatoria-en-memoria.repositorio';
import { ESTUDIANTE_REPOSITORIO } from '../src/modules/estudiantes/domain/ports/estudiante.repositorio';
import { EstudiantesModule } from '../src/modules/estudiantes/estudiantes.module';
import { EstudianteEnMemoriaRepositorio } from '../src/modules/estudiantes/infrastructure/persistence/estudiante-en-memoria.repositorio';
import { ComitesService } from '../src/modules/evaluaciones/application/services/comites.service';
import { ConsolidadoService } from '../src/modules/evaluaciones/application/services/consolidado.service';
import { EvaluacionService } from '../src/modules/evaluaciones/application/services/evaluacion.service';
import { COMITE_REPOSITORIO } from '../src/modules/evaluaciones/domain/ports/comite.repositorio';
import {
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_PERFILES_EVALUACION,
  CONSULTA_SOLICITUDES,
} from '../src/modules/evaluaciones/domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO } from '../src/modules/evaluaciones/domain/ports/dictamen.repositorio';
import {
  ConsultaConvocatoriasEvaluacionAdapter,
  ConsultaCuentasAdapter,
  ConsultaPerfilesEvaluacionAdapter,
  ConsultaSolicitudesAdapter,
} from '../src/modules/evaluaciones/infrastructure/integraciones/consultas-externas.adapter';
import {
  ComiteEnMemoriaRepositorio,
  DictamenEnMemoriaRepositorio,
} from '../src/modules/evaluaciones/infrastructure/persistence/evaluaciones-en-memoria.repositorio';
import { ComitesController } from '../src/modules/evaluaciones/presentation/controllers/comites.controller';
import { EvaluacionesController } from '../src/modules/evaluaciones/presentation/controllers/evaluaciones.controller';
import { ALMACENAMIENTO_DOCUMENTOS } from '../src/modules/solicitudes/domain/ports/almacenamiento-documentos';
import { SOLICITUD_REPOSITORIO } from '../src/modules/solicitudes/domain/ports/solicitud.repositorio';
import { AlmacenamientoMemoriaAdapter } from '../src/modules/solicitudes/infrastructure/almacenamiento/almacenamiento-memoria.adapter';
import { SolicitudEnMemoriaRepositorio } from '../src/modules/solicitudes/infrastructure/persistence/solicitud-en-memoria.repositorio';
import { SolicitudesModule } from '../src/modules/solicitudes/solicitudes.module';
import { CuentasEvaluadorService } from '../src/modules/usuarios/application/services/cuentas-evaluador.service';
import { Usuario } from '../src/modules/usuarios/domain/entities/usuario.entity';
import { RolUsuario } from '../src/modules/usuarios/domain/enums/rol-usuario.enum';
import { HASHER_PASSWORD } from '../src/modules/usuarios/domain/ports/hasher-password';
import { USUARIO_REPOSITORIO } from '../src/modules/usuarios/domain/ports/usuario.repositorio';
import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../src/modules/usuarios/domain/ports/verificador-token';
import { Cui } from '../src/modules/usuarios/domain/value-objects/cui.vo';
import { NombreUsuario } from '../src/modules/usuarios/domain/value-objects/nombre-usuario.vo';
import { BcryptHasherAdapter } from '../src/modules/usuarios/infrastructure/adapters/bcrypt-hasher.adapter';
import { UsuarioEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/usuario-en-memoria.repositorio';
import { EvaluadoresController } from '../src/modules/usuarios/presentation/controllers/evaluadores.controller';
import { AutenticacionGuard } from '../src/modules/usuarios/presentation/guards/autenticacion.guard';
import { RolesGuard } from '../src/modules/usuarios/presentation/guards/roles.guard';
import { DominioExceptionFilter } from '../src/shared/exceptions/dominio-exception.filter';

const ANA = '0b6f7c1e-0000-4000-8000-000000000001';
const LUIS = '0b6f7c1e-0000-4000-8000-000000000002';

/** Token de prueba: `id:<usuario>:<rol>`. Así un evaluador creado durante la prueba tiene sesión. */
class VerificadorFalso implements VerificadorToken {
  verificar(token: string): Promise<PortadorToken | null> {
    const [prefijo, usuarioId, rol] = token.split(':');
    return Promise.resolve(
      prefijo === 'id' ? { usuarioId, nombreUsuario: usuarioId, rol: rol as RolUsuario } : null,
    );
  }
}

const sesion = (id: string, rol: RolUsuario) => ({ Authorization: `Bearer id:${id}:${rol}` });
const admin = sesion('0b6f7c1e-0000-4000-8000-0000000000aa', RolUsuario.ADMINISTRADOR);
const ana = sesion(ANA, RolUsuario.ESTUDIANTE);
const luis = sesion(LUIS, RolUsuario.ESTUDIANTE);

function estudiante(id: string, usuario: string, nombre: string, cui: string): Usuario {
  return Usuario.nuevoEstudiante({
    id,
    nombreUsuario: NombreUsuario.crear(usuario),
    correo: `${usuario}@correo.gt`,
    hashPassword: 'no-se-usa',
    nombreCompleto: nombre,
    cui: Cui.crear(cui),
  });
}

@Module({
  controllers: [EvaluadoresController],
  providers: [
    CuentasEvaluadorService,
    {
      provide: USUARIO_REPOSITORIO,
      useFactory: () =>
        new UsuarioEnMemoriaRepositorio([
          estudiante(ANA, 'ana.lopez', 'Ana López', '1111111110101'),
          estudiante(LUIS, 'luis.cac', 'Luis Cac', '2222222220101'),
        ]),
    },
    { provide: ConfigService, useValue: { get: () => '4' } },
    { provide: HASHER_PASSWORD, useClass: BcryptHasherAdapter },
  ],
  exports: [CuentasEvaluadorService],
})
class CuentasDePruebaModule {}

const PERFIL = {
  centroEducativo: 'Universidad Mariano Gálvez',
  nivel: 'UNIVERSITARIO',
  promedio: 80,
  ingresoFamiliarMensual: 5500,
  dependientes: 2,
  departamento: 'PETEN',
  municipio: 'Flores',
};
const OBSERVACION = 'Promedio sólido y documentación completa y legible.';
const PDF = Buffer.from('%PDF-1.7\n');

describe('Evaluación y comités (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConvocatoriasModule, EstudiantesModule, SolicitudesModule, CuentasDePruebaModule],
      controllers: [ComitesController, EvaluacionesController],
      providers: [
        ComitesService,
        EvaluacionService,
        ConsolidadoService,
        { provide: COMITE_REPOSITORIO, useValue: new ComiteEnMemoriaRepositorio() },
        { provide: DICTAMEN_REPOSITORIO, useValue: new DictamenEnMemoriaRepositorio() },
        { provide: CONSULTA_SOLICITUDES, useClass: ConsultaSolicitudesAdapter },
        {
          provide: CONSULTA_CONVOCATORIAS_EVALUACION,
          useClass: ConsultaConvocatoriasEvaluacionAdapter,
        },
        { provide: CONSULTA_PERFILES_EVALUACION, useClass: ConsultaPerfilesEvaluacionAdapter },
        { provide: CONSULTA_CUENTAS, useClass: ConsultaCuentasAdapter },
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
      .useValue(new AlmacenamientoMemoriaAdapter())
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

  async function convocatoria(): Promise<string> {
    const { body } = await servidor()
      .post('/convocatorias')
      .set(admin)
      .send({
        tipo: 'UNIVERSITARIA',
        titulo: 'Beca Universitaria 2026',
        descripcion: 'Licenciaturas.',
        cupos: 1,
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2099-12-31T00:00:00.000Z',
        documentosExigidos: ['DPI'],
      })
      .expect(201);
    await servidor().post(`/convocatorias/${body.id}/publicar`).set(admin).expect(200);
    return body.id as string;
  }

  async function enviar(quien: Record<string, string>, convocatoriaId: string, perfil = PERFIL) {
    await servidor().put('/estudiantes/perfil').set(quien).send(perfil).expect(200);
    const { body } = await servidor()
      .post('/solicitudes')
      .set(quien)
      .send({ convocatoriaId })
      .expect(201);
    await servidor()
      .put(`/solicitudes/${body.id}/documentos/DPI`)
      .set(quien)
      .attach('archivo', PDF, 'dpi.pdf')
      .expect(200);
    await servidor().post(`/solicitudes/${body.id}/enviar`).set(quien).expect(200);
    return body.id as string;
  }

  async function evaluador(usuario: string, cui: string) {
    const { body } = await servidor()
      .post('/evaluadores')
      .set(admin)
      .send({
        nombreCompleto: `Evaluador ${usuario}`,
        cui,
        correo: `${usuario}@mineduc.gt`,
        nombreUsuario: usuario,
        password: 'Evalua2026',
      })
      .expect(201);
    return { id: body.id as string, token: sesion(body.id, RolUsuario.EVALUADOR) };
  }

  async function escenario() {
    const convocatoriaId = await convocatoria();
    const solAna = await enviar(ana, convocatoriaId);
    const solLuis = await enviar(luis, convocatoriaId, {
      ...PERFIL,
      promedio: 95,
      ingresoFamiliarMensual: 1000,
    });
    const eva = await evaluador('eva.ruiz', '3333333330101');
    const beto = await evaluador('beto.paz', '4444444440101');
    const { body: comite } = await servidor()
      .post('/comites')
      .set(admin)
      .send({ nombre: 'Comité universitario', convocatoriaId, evaluadorIds: [eva.id] })
      .expect(201);
    return { convocatoriaId, solAna, solLuis, eva, beto, comiteId: comite.id as string };
  }

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
