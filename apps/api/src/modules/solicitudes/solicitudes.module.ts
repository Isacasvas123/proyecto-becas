import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CargarDocumentoService } from './application/services/cargar-documento.service';
import { CrearSolicitudService } from './application/services/crear-solicitud.service';
import { EnviarSolicitudService } from './application/services/enviar-solicitud.service';
import { ExpedienteService } from './application/services/expediente.service';
import { SolicitudesParaEvaluacionService } from './application/services/solicitudes-para-evaluacion.service';
import { ALMACENAMIENTO_DOCUMENTOS } from './domain/ports/almacenamiento-documentos';
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
import { SolicitudesController } from './presentation/controllers/solicitudes.controller';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';

/**
 * EPIC-03 · solicitudes (US-012 a US-016).
 *
 * Importa los MÓDULOS de convocatorias y estudiantes para usar lo que ellos exportan —casos de
 * uso, nunca repositorios— a través de los adaptadores de `infrastructure/integraciones/`.
 */
@Module({
  imports: [ConvocatoriasModule, EstudiantesModule],
  controllers: [SolicitudesController],
  providers: [
    ExpedienteService,
    CrearSolicitudService,
    CargarDocumentoService,
    EnviarSolicitudService,
    SolicitudesParaEvaluacionService,
    { provide: SOLICITUD_REPOSITORIO, useClass: SolicitudPrismaRepositorio },
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
  // Solo la puerta para `evaluaciones` (EPIC-04). Ver el comentario del servicio.
  exports: [SolicitudesParaEvaluacionService],
})
export class SolicitudesModule {}
