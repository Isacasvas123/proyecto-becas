import { Module } from '@nestjs/common';

import { ResolucionFacade } from './application/facades/resolucion.facade';
import { ConsultaPublicaService } from './application/services/consulta-publica.service';
import {
  CONSULTA_CONVOCATORIAS_RESOLUCION,
  CONSULTA_DICTAMENES,
  CONSULTA_IDENTIDAD,
  CONSULTA_SOLICITUDES_RESOLUCION,
} from './domain/ports/consultas-externas';
import { NOTIFICADOR_RESOLUCIONES } from './domain/ports/notificador-resoluciones';
import {
  ConsultaConvocatoriasResolucionAdapter,
  ConsultaDictamenesAdapter,
  ConsultaIdentidadAdapter,
  ConsultaSolicitudesResolucionAdapter,
  NotificadorResolucionesConsolaAdapter,
} from './infrastructure/integraciones/consultas-externas.adapter';
import {
  ConsultaPublicaController,
  CuposPublicosController,
  ResolucionesController,
} from './presentation/controllers/resoluciones.controller';
import { LimiteConsultasGuard } from './presentation/guards/limite-consultas.guard';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { EvaluacionesModule } from '../evaluaciones/evaluaciones.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * EPIC-05 · resolución, adjudicación y consulta pública (US-023 a US-025). Patrón Facade.
 *
 * Es el módulo más "alto": depende de cuatro y ninguno depende de él. No tiene tablas propias:
 * la beca es parte de la solicitud.
 */
@Module({
  imports: [ConvocatoriasModule, EvaluacionesModule, SolicitudesModule, UsuariosModule],
  controllers: [ResolucionesController, CuposPublicosController, ConsultaPublicaController],
  providers: [
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
  ],
})
export class ResolucionesModule {}
