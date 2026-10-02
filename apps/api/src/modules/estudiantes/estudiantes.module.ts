import { Module } from '@nestjs/common';

import { PerfilEstudianteService } from './application/services/perfil-estudiante.service';
import { ESTUDIANTE_REPOSITORIO } from './domain/ports/estudiante.repositorio';
import { EstudiantePrismaRepositorio } from './infrastructure/persistence/estudiante-prisma.repositorio';
import { EstudiantesController } from './presentation/controllers/estudiantes.controller';

/**
 * EPIC-03 · perfil académico del estudiante (US-011).
 *
 * Exporta el caso de uso, no el repositorio: `solicitudes` pregunta por el estado del perfil a
 * través de `PerfilEstudianteService.estadoDePerfil`.
 */
@Module({
  controllers: [EstudiantesController],
  providers: [
    PerfilEstudianteService,
    { provide: ESTUDIANTE_REPOSITORIO, useClass: EstudiantePrismaRepositorio },
  ],
  exports: [PerfilEstudianteService],
})
export class EstudiantesModule {}
