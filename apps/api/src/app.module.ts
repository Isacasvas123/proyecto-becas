/**
 * Módulo raíz de la API.
 *
 * Un monolito modular: un solo artefacto desplegable que aquí ensambla sus módulos de
 * negocio (docs/05-arquitectura.md §2.1).
 *
 * SPRINTS 2 a 8 — se irán agregando a la lista de `imports`:
 *   UsuariosModule · EstudiantesModule · SolicitudesModule · EvaluacionesModule ·
 *   ReportesModule
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConvocatoriasModule } from './modules/convocatorias/convocatorias.module';
import { SaludModule } from './modules/salud/salud.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PrismaModule } from './shared/persistence/prisma.module';

@Module({
  imports: [
    // Las variables de entorno se leen del `.env` de la raíz del repositorio.
    // Ninguna credencial vive en el código (ver `.env.example`).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    SaludModule,
    ConvocatoriasModule,
    UsuariosModule,
  ],
})
export class AppModule {}
