/**
 * Módulo de diagnóstico: `GET /health` y `GET /ready`.
 *
 * Importa `PrismaModule` aunque sea `@Global` porque depender de que otro lo haya cargado es una
 * dependencia invisible: funcionaba en la aplicación pero fallaba al levantar el módulo aislado
 * en una prueba. Declararlo lo hace autosuficiente (lo detectó `salud.e2e-spec.ts`).
 */
import { Module } from '@nestjs/common';

import { SaludController } from './presentation/controllers/salud.controller';
import { PrismaModule } from '../../shared/persistence/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaludController],
})
export class SaludModule {}
