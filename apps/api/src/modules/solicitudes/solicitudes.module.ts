import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CargarDocumentoService } from './application/services/cargar-documento.service';
import { CrearSolicitudService } from './application/services/crear-solicitud.service';
import { EnviarSolicitudService } from './application/services/enviar-solicitud.service';
import { ExpedienteService } from './application/services/expediente.service';
import { SolicitudesParaEvaluacionService } from './application/services/solicitudes-para-evaluacion.service';
import { SolicitudesParaReportesService } from './application/services/solicitudes-para-reportes.service';
import { SolicitudesParaResolucionService } from './application/services/solicitudes-para-resolucion.service';
import { ALMACENAMIENTO_DOCUMENTOS } from './domain/ports/almacenamiento-documentos';
import { OBSERVADORES_SOLICITUD } from './domain/events/evento-solicitud';
import { PublicadorEventosSolicitud } from './application/services/publicador-eventos.service';
import { NotificacionesService } from './application/services/notificaciones.service';
import { NOTIFICACION_REPOSITORIO } from './domain/ports/notificacion.repositorio';
import { NotificacionPrismaRepositorio } from './infrastructure/persistence/notificacion-prisma.repositorio';
import { NotificadorEstudianteObservador } from './infrastructure/notificaciones/notificador-estudiante.observador';
import { CONSULTA_CONVOCATORIAS, CONSULTA_PERFILES } from './domain/ports/consultas-externas';
import { NOTIFICADOR_SOLICITUDES } from './domain/ports/notificador-solicitudes';
import { SOLICITUD_REPOSITORIO } from './domain/ports/solicitud.repositorio';
import { AlmacenamientoLocalAdapter } from './infrastructure/almacenamiento/almacenamiento-local.adapter';
import {
  ConsultaConvocatoriasAdapter,
  ConsultaPerfilesAdapter,
} from './infrastructure/integraciones/consultas-externas.adapter';
import { NotificadorConsolaAdapter } from './infrastructure/notificaciones/notificador-consola.adapter';
import { SolicitudPrismaRepositorio } from './infrastructure/persistence/solicitud-prisma.repositorio';
import {
  SolicitudesController,
  NotificacionesController,
} from './presentation/controllers/solicitudes.controller';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';

/**
 * EPIC-03 · solicitudes (US-012 a US-016).
 *
 * Importa los módulos de convocatorias y estudiantes para usar lo que ellos exportan —casos de
 * uso, nunca repositorios— a través de los adaptadores de `infrastructure/integraciones/`.
 */
@Module({
  imports: [ConvocatoriasModule, EstudiantesModule],
  controllers: [SolicitudesController, NotificacionesController],
  providers: [
    ExpedienteService,
    CrearSolicitudService,
    CargarDocumentoService,
    EnviarSolicitudService,
    SolicitudesParaEvaluacionService,
    SolicitudesParaResolucionService,
    SolicitudesParaReportesService,
    { provide: SOLICITUD_REPOSITORIO, useClass: SolicitudPrismaRepositorio },
    // Patrón observer (PO, 17 Oct 2026). Sumar un interesado en los cambios de estado —un correo,
    // una integración— es agregarlo a esta lista: ningún caso de uso cambia.
    PublicadorEventosSolicitud,
    NotificacionesService,
    NotificadorEstudianteObservador,
    { provide: NOTIFICACION_REPOSITORIO, useClass: NotificacionPrismaRepositorio },
    {
      provide: OBSERVADORES_SOLICITUD,
      inject: [NotificadorEstudianteObservador],
      useFactory: (notificador: NotificadorEstudianteObservador) => [notificador],
    },
    { provide: CONSULTA_CONVOCATORIAS, useClass: ConsultaConvocatoriasAdapter },
    { provide: CONSULTA_PERFILES, useClass: ConsultaPerfilesAdapter },
    { provide: NOTIFICADOR_SOLICITUDES, useClass: NotificadorConsolaAdapter },
    {
      // Patrón Adapter: el adaptador se elige por configuración, sin que el dominio se entere.
      provide: ALMACENAMIENTO_DOCUMENTOS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const tipo = config.get<string>('ALMACENAMIENTO_TIPO') ?? 'local';
        if (tipo === 'local') {
          return new AlmacenamientoLocalAdapter(
            config.get<string>('ALMACENAMIENTO_RUTA_LOCAL') ?? './uploads',
          );
        }
        // Fallar al arrancar, no al primer documento: un despliegue mal configurado se ve de inmediato.
        throw new Error(`ALMACENAMIENTO_TIPO="${tipo}" no está implementado todavía. Use "local".`);
      },
    },
  ],
  // Solo las puertas para `evaluaciones` (EPIC-04), `resoluciones` (EPIC-05) y `reportes` (EPIC-06).
  exports: [
    SolicitudesParaEvaluacionService,
    SolicitudesParaResolucionService,
    SolicitudesParaReportesService,
  ],
})
export class SolicitudesModule {}
