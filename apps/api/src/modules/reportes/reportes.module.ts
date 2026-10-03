import { Module } from '@nestjs/common';

import { GenerarReporteService } from './application/services/generar-reporte.service';
import { PanelService } from './application/services/panel.service';
import { ReporteRegionesService } from './application/services/reporte-regiones.service';
import {
  EXPORTADORES,
  FUENTE_CONVOCATORIAS,
  FUENTE_PERFILES,
  FUENTE_SOLICITUDES,
} from './domain/ports/puertos';
import { CsvExportador } from './infrastructure/exportadores/csv.exportador';
import { PdfExportador } from './infrastructure/exportadores/pdf.exportador';
import {
  FuenteConvocatoriasAdapter,
  FuentePerfilesAdapter,
  FuenteSolicitudesAdapter,
} from './infrastructure/integraciones/fuentes.adapter';
import { ReportesController } from './presentation/reportes.controller';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';

/**
 * EPIC-06 · reportes y estadísticas (US-028 a US-031). Patrón Builder.
 *
 * Solo LEE: no escribe en ninguna tabla. Depende de tres módulos por sus servicios exportados y
 * nadie depende de él. Los formatos de salida se registran aquí: uno nuevo es una clase más en la
 * lista de `EXPORTADORES`.
 */
@Module({
  imports: [ConvocatoriasModule, EstudiantesModule, SolicitudesModule],
  controllers: [ReportesController],
  providers: [
    GenerarReporteService,
    PanelService,
    ReporteRegionesService,
    CsvExportador,
    PdfExportador,
    {
      provide: EXPORTADORES,
      inject: [CsvExportador, PdfExportador],
      useFactory: (csv: CsvExportador, pdf: PdfExportador) => [csv, pdf],
    },
    { provide: FUENTE_SOLICITUDES, useClass: FuenteSolicitudesAdapter },
    { provide: FUENTE_PERFILES, useClass: FuentePerfilesAdapter },
    { provide: FUENTE_CONVOCATORIAS, useClass: FuenteConvocatoriasAdapter },
  ],
})
export class ReportesModule {}
