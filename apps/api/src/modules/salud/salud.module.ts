/**
 * Módulo de diagnóstico: `GET /health` y `GET /ready`.
 *
 * POR QUÉ IMPORTA `PrismaModule` EXPLÍCITAMENTE SI ES `@Global`
 *   Porque depender de que otro módulo lo haya cargado es una dependencia invisible. El
 *   módulo funcionaba en la aplicación real —donde `AppModule` importa `PrismaModule`— pero
 *   fallaba al levantarlo solo en una prueba de integración, con un error que no dice nada
 *   sobre la causa real.
 *
 *   Declararlo aquí hace que el módulo sea autosuficiente: se puede levantar aislado, y quien
 *   lea este archivo ve de qué depende sin tener que rastrear el resto del proyecto.
 *
 *   Lo detectó la prueba `salud.e2e-spec.ts` al sustituir `PrismaService` por un doble.
 */
import { Module } from '@nestjs/common';

import { SaludController } from './presentation/controllers/salud.controller';
import { PrismaModule } from '../../shared/persistence/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaludController],
})
export class SaludModule {}
