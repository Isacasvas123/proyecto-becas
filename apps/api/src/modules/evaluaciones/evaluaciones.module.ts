import { Module } from '@nestjs/common';

import { ComitesService } from './application/services/comites.service';
import { ConsolidadoService } from './application/services/consolidado.service';
import { EvaluacionService } from './application/services/evaluacion.service';
import { COMITE_REPOSITORIO } from './domain/ports/comite.repositorio';
import {
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_PERFILES_EVALUACION,
  CONSULTA_SOLICITUDES,
} from './domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO } from './domain/ports/dictamen.repositorio';
import {
  ConsultaConvocatoriasEvaluacionAdapter,
  ConsultaCuentasAdapter,
  ConsultaPerfilesEvaluacionAdapter,
  ConsultaSolicitudesAdapter,
} from './infrastructure/integraciones/consultas-externas.adapter';
import {
  ComitePrismaRepositorio,
  DictamenPrismaRepositorio,
} from './infrastructure/persistence/evaluaciones-prisma.repositorio';
import { ComitesController } from './presentation/controllers/comites.controller';
import { EvaluacionesController } from './presentation/controllers/evaluaciones.controller';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * EPIC-04 · comités, asignación, dictámenes y consolidado (US-017 a US-021). Patrón Strategy.
 *
 * Depende de cuatro módulos y ninguno depende de él. Los usa por sus servicios exportados, a
 * través de los adaptadores de `infrastructure/integraciones/`.
 */
@Module({
  imports: [ConvocatoriasModule, EstudiantesModule, SolicitudesModule, UsuariosModule],
  controllers: [ComitesController, EvaluacionesController],
  providers: [
    ComitesService,
    EvaluacionService,
    ConsolidadoService,
    { provide: COMITE_REPOSITORIO, useClass: ComitePrismaRepositorio },
    { provide: DICTAMEN_REPOSITORIO, useClass: DictamenPrismaRepositorio },
    { provide: CONSULTA_SOLICITUDES, useClass: ConsultaSolicitudesAdapter },
    {
      provide: CONSULTA_CONVOCATORIAS_EVALUACION,
      useClass: ConsultaConvocatoriasEvaluacionAdapter,
    },
    { provide: CONSULTA_PERFILES_EVALUACION, useClass: ConsultaPerfilesEvaluacionAdapter },
    { provide: CONSULTA_CUENTAS, useClass: ConsultaCuentasAdapter },
  ],
})
export class EvaluacionesModule {}
