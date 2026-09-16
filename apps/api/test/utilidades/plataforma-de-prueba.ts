/**
 * La plataforma completa montada para las pruebas de integración de EPIC-04 y EPIC-05.
 *
 * POR QUÉ NO SE IMPORTAN `EvaluacionesModule` NI `ResolucionesModule`
 *   Los dos importan `UsuariosModule`, que importa `@nestjs/jwt`, y en esta rama Jest todavía no
 *   puede cargar esa biblioteca (solo ESM; lo corrige el PR #12). Aquí se arma el mismo grafo con
 *   los mismos controladores, servicios y adaptadores, y un módulo de cuentas de prueba con los
 *   casos de uso reales de `usuarios` y bcrypt real. Lo único sustituido: repositorios en memoria,
 *   almacenamiento en memoria y el verificador de tokens.
 */
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ConvocatoriasModule } from '../../src/modules/convocatorias/convocatorias.module';
import { CONVOCATORIA_REPOSITORIO } from '../../src/modules/convocatorias/domain/ports/convocatoria.repositorio';
import { ConvocatoriaEnMemoriaRepositorio } from '../../src/modules/convocatorias/infrastructure/persistence/convocatoria-en-memoria.repositorio';
import { ESTUDIANTE_REPOSITORIO } from '../../src/modules/estudiantes/domain/ports/estudiante.repositorio';
import { EstudiantesModule } from '../../src/modules/estudiantes/estudiantes.module';
import { EstudianteEnMemoriaRepositorio } from '../../src/modules/estudiantes/infrastructure/persistence/estudiante-en-memoria.repositorio';
import { ComitesService } from '../../src/modules/evaluaciones/application/services/comites.service';
import { ConsolidadoService } from '../../src/modules/evaluaciones/application/services/consolidado.service';
import { DictamenesDeSolicitudService } from '../../src/modules/evaluaciones/application/services/dictamenes-de-solicitud.service';
import { EvaluacionService } from '../../src/modules/evaluaciones/application/services/evaluacion.service';
import { COMITE_REPOSITORIO } from '../../src/modules/evaluaciones/domain/ports/comite.repositorio';
import {
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_PERFILES_EVALUACION,
  CONSULTA_SOLICITUDES,
} from '../../src/modules/evaluaciones/domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO } from '../../src/modules/evaluaciones/domain/ports/dictamen.repositorio';
import {
  ConsultaConvocatoriasEvaluacionAdapter,
  ConsultaCuentasAdapter,
  ConsultaPerfilesEvaluacionAdapter,
  ConsultaSolicitudesAdapter,
} from '../../src/modules/evaluaciones/infrastructure/integraciones/consultas-externas.adapter';
import {
  ComiteEnMemoriaRepositorio,
  DictamenEnMemoriaRepositorio,
} from '../../src/modules/evaluaciones/infrastructure/persistence/evaluaciones-en-memoria.repositorio';
import { ComitesController } from '../../src/modules/evaluaciones/presentation/controllers/comites.controller';
import { EvaluacionesController } from '../../src/modules/evaluaciones/presentation/controllers/evaluaciones.controller';
import { ResolucionFacade } from '../../src/modules/resoluciones/application/facades/resolucion.facade';
import { ConsultaPublicaService } from '../../src/modules/resoluciones/application/services/consulta-publica.service';
import {
  CONSULTA_CONVOCATORIAS_RESOLUCION,
  CONSULTA_DICTAMENES,
  CONSULTA_IDENTIDAD,
  CONSULTA_SOLICITUDES_RESOLUCION,
} from '../../src/modules/resoluciones/domain/ports/consultas-externas';
import { NOTIFICADOR_RESOLUCIONES } from '../../src/modules/resoluciones/domain/ports/notificador-resoluciones';
import {
  ConsultaConvocatoriasResolucionAdapter,
  ConsultaDictamenesAdapter,
  ConsultaIdentidadAdapter,
  ConsultaSolicitudesResolucionAdapter,
  NotificadorResolucionesConsolaAdapter,
} from '../../src/modules/resoluciones/infrastructure/integraciones/consultas-externas.adapter';
import {
  ConsultaPublicaController,
  ResolucionesController,
} from '../../src/modules/resoluciones/presentation/controllers/resoluciones.controller';
import { LimiteConsultasGuard } from '../../src/modules/resoluciones/presentation/guards/limite-consultas.guard';
import { ALMACENAMIENTO_DOCUMENTOS } from '../../src/modules/solicitudes/domain/ports/almacenamiento-documentos';
import { SOLICITUD_REPOSITORIO } from '../../src/modules/solicitudes/domain/ports/solicitud.repositorio';
import { AlmacenamientoMemoriaAdapter } from '../../src/modules/solicitudes/infrastructure/almacenamiento/almacenamiento-memoria.adapter';
import { SolicitudEnMemoriaRepositorio } from '../../src/modules/solicitudes/infrastructure/persistence/solicitud-en-memoria.repositorio';
import { SolicitudesModule } from '../../src/modules/solicitudes/solicitudes.module';
import { CuentasEvaluadorService } from '../../src/modules/usuarios/application/services/cuentas-evaluador.service';
import { IdentidadService } from '../../src/modules/usuarios/application/services/identidad.service';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuario.entity';
import { RolUsuario } from '../../src/modules/usuarios/domain/enums/rol-usuario.enum';
import { HASHER_PASSWORD } from '../../src/modules/usuarios/domain/ports/hasher-password';
import { USUARIO_REPOSITORIO } from '../../src/modules/usuarios/domain/ports/usuario.repositorio';
import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../../src/modules/usuarios/domain/ports/verificador-token';
import { Cui } from '../../src/modules/usuarios/domain/value-objects/cui.vo';
import { NombreUsuario } from '../../src/modules/usuarios/domain/value-objects/nombre-usuario.vo';
import { BcryptHasherAdapter } from '../../src/modules/usuarios/infrastructure/adapters/bcrypt-hasher.adapter';
import { UsuarioEnMemoriaRepositorio } from '../../src/modules/usuarios/infrastructure/persistence/usuario-en-memoria.repositorio';
import { EvaluadoresController } from '../../src/modules/usuarios/presentation/controllers/evaluadores.controller';
import { AutenticacionGuard } from '../../src/modules/usuarios/presentation/guards/autenticacion.guard';
import { RolesGuard } from '../../src/modules/usuarios/presentation/guards/roles.guard';
import { DominioExceptionFilter } from '../../src/shared/exceptions/dominio-exception.filter';

export const ANA = '0b6f7c1e-0000-4000-8000-000000000001';
export const LUIS = '0b6f7c1e-0000-4000-8000-000000000002';
export const CUI_ANA = '1111111110101';
export const CUI_LUIS = '2222222220101';

/** Token de prueba: `id:<usuario>:<rol>`. Así un evaluador creado durante la prueba tiene sesión. */
class VerificadorFalso implements VerificadorToken {
  verificar(token: string): Promise<PortadorToken | null> {
    const [prefijo, usuarioId, rol] = token.split(':');
    return Promise.resolve(
      prefijo === 'id' ? { usuarioId, nombreUsuario: usuarioId, rol: rol as RolUsuario } : null,
    );
  }
}

export const sesion = (id: string, rol: RolUsuario) => ({
  Authorization: `Bearer id:${id}:${rol}`,
});
export const admin = sesion('0b6f7c1e-0000-4000-8000-0000000000aa', RolUsuario.ADMINISTRADOR);
export const ana = sesion(ANA, RolUsuario.ESTUDIANTE);
export const luis = sesion(LUIS, RolUsuario.ESTUDIANTE);

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
    IdentidadService,
    {
      provide: USUARIO_REPOSITORIO,
      useFactory: () =>
        new UsuarioEnMemoriaRepositorio([
          estudiante(ANA, 'ana.lopez', 'Ana López', CUI_ANA),
          estudiante(LUIS, 'luis.cac', 'Luis Cac', CUI_LUIS),
        ]),
    },
    { provide: ConfigService, useValue: { get: () => '4' } },
    { provide: HASHER_PASSWORD, useClass: BcryptHasherAdapter },
  ],
  exports: [CuentasEvaluadorService, IdentidadService],
})
class CuentasDePruebaModule {}

export const PERFIL = {
  centroEducativo: 'Universidad Mariano Gálvez',
  nivel: 'UNIVERSITARIO',
  promedio: 80,
  ingresoFamiliarMensual: 5500,
  dependientes: 2,
  departamento: 'PETEN',
  municipio: 'Flores',
};
export const OBSERVACION = 'Promedio sólido y documentación completa y legible.';
const PDF = Buffer.from('%PDF-1.7\n');

export async function montarPlataforma(): Promise<INestApplication<App>> {
  const modulo = await Test.createTestingModule({
    imports: [ConvocatoriasModule, EstudiantesModule, SolicitudesModule, CuentasDePruebaModule],
    controllers: [
      ComitesController,
      EvaluacionesController,
      ResolucionesController,
      ConsultaPublicaController,
    ],
    providers: [
      // evaluaciones
      ComitesService,
      EvaluacionService,
      ConsolidadoService,
      DictamenesDeSolicitudService,
      { provide: COMITE_REPOSITORIO, useValue: new ComiteEnMemoriaRepositorio() },
      { provide: DICTAMEN_REPOSITORIO, useValue: new DictamenEnMemoriaRepositorio() },
      { provide: CONSULTA_SOLICITUDES, useClass: ConsultaSolicitudesAdapter },
      {
        provide: CONSULTA_CONVOCATORIAS_EVALUACION,
        useClass: ConsultaConvocatoriasEvaluacionAdapter,
      },
      { provide: CONSULTA_PERFILES_EVALUACION, useClass: ConsultaPerfilesEvaluacionAdapter },
      { provide: CONSULTA_CUENTAS, useClass: ConsultaCuentasAdapter },
      // resoluciones
      ResolucionFacade,
      ConsultaPublicaService,
      LimiteConsultasGuard,
      { provide: CONSULTA_SOLICITUDES_RESOLUCION, useClass: ConsultaSolicitudesResolucionAdapter },
      { provide: CONSULTA_DICTAMENES, useClass: ConsultaDictamenesAdapter },
      {
        provide: CONSULTA_CONVOCATORIAS_RESOLUCION,
        useClass: ConsultaConvocatoriasResolucionAdapter,
      },
      { provide: CONSULTA_IDENTIDAD, useClass: ConsultaIdentidadAdapter },
      { provide: NOTIFICADOR_RESOLUCIONES, useClass: NotificadorResolucionesConsolaAdapter },
      // seguridad
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

  const app = modulo.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DominioExceptionFilter());
  await app.init();
  return app;
}

/** Los pasos que repiten las pruebas: publicar, postular y enviar, crear evaluadores y comité. */
export function pasos(app: INestApplication<App>) {
  const servidor = () => request(app.getHttpServer());

  async function convocatoria(cupos = 1): Promise<string> {
    const { body } = await servidor()
      .post('/convocatorias')
      .set(admin)
      .send({
        tipo: 'UNIVERSITARIA',
        titulo: 'Beca Universitaria 2026',
        descripcion: 'Licenciaturas.',
        cupos,
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2099-12-31T00:00:00.000Z',
        documentosExigidos: ['DPI'],
      })
      .expect(201);
    await servidor().post(`/convocatorias/${body.id}/publicar`).set(admin).expect(200);
    return body.id as string;
  }

  async function enviar(
    quien: Record<string, string>,
    convocatoriaId: string,
    perfil = PERFIL,
  ): Promise<string> {
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

  async function escenario(cupos = 1) {
    const convocatoriaId = await convocatoria(cupos);
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

  return { servidor, convocatoria, enviar, evaluador, escenario };
}
