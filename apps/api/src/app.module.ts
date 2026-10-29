/**
 * Módulo raíz de la API: un monolito modular, un solo artefacto desplegable que ensambla los
 * módulos de negocio (docs/05-arquitectura.md §2.1).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BitacoraModule } from './modules/bitacora/bitacora.module';
import { ConvocatoriasModule } from './modules/convocatorias/convocatorias.module';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module';
import { EvaluacionesModule } from './modules/evaluaciones/evaluaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { ResolucionesModule } from './modules/resoluciones/resoluciones.module';
import { SaludModule } from './modules/salud/salud.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
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
    EstudiantesModule,
    SolicitudesModule,
    EvaluacionesModule,
    ResolucionesModule,
    ReportesModule,
    // Transversal: su interceptor se registra global y audita todas las rutas de arriba.
    BitacoraModule,
  ],
})
export class AppModule {}
