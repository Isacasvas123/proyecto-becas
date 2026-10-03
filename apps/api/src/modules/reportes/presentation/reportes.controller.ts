import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import type { Response } from 'express';

import { ReporteBuilder } from '../application/builders/reporte.builder';
import { GenerarReporteService } from '../application/services/generar-reporte.service';
import { PanelDto, PanelService } from '../application/services/panel.service';
import { ReporteRegionesService } from '../application/services/reporte-regiones.service';
import { EXPORTADORES, ExportadorReporte } from '../domain/ports/puertos';
import { Reporte } from '../domain/reporte';
import { RolUsuario } from '../../usuarios/domain/enums/rol-usuario.enum';
import { Roles } from '../../usuarios/presentation/guards/decoradores';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MENSAJE_FECHA = 'Las fechas van como AAAA-MM-DD';

/** `?estado=APROBADA,RECHAZADA` o `?estado=APROBADA&estado=RECHAZADA`. */
const lista = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : (Array.isArray(value) ? value : [value]).flatMap((v) => String(v).split(',')).filter(Boolean);

export class ReporteSolicitudesQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'La convocatoria indicada no es válida' })
  convocatoriaId?: string;

  @IsOptional()
  @Transform(lista)
  @IsArray()
  @IsString({ each: true })
  estado?: string[];

  @IsOptional()
  @IsString()
  nivel?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @Matches(FECHA, { message: MENSAJE_FECHA })
  desde?: string;

  @IsOptional()
  @Matches(FECHA, { message: MENSAJE_FECHA })
  hasta?: string;

  @IsOptional()
  @IsString()
  agruparPor?: string;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @IsOptional()
  @IsString()
  formato?: string;
}

export class ReporteConvocatoriaQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'La convocatoria indicada no es válida' })
  convocatoriaId?: string;

  @IsOptional()
  @IsIn(['JSON', 'CSV', 'PDF'], { message: 'Formato no disponible. Use JSON, CSV o PDF.' })
  formato?: string;
}

/**
 * EPIC-06. Solo administración.
 *
 * AQUÍ SE VE EL BUILDER
 *   Cada parámetro de la consulta es opcional, y el controlador solo llama al paso del builder que
 *   corresponde a los que llegaron. No hay un `if` por cada combinación ni un constructor con nueve
 *   argumentos, y las combinaciones sin sentido las rechaza `build()`.
 *
 * FECHAS
 *   Se reciben como días (AAAA-MM-DD) en hora de Guatemala: "desde" empieza a las 00:00 y "hasta"
 *   termina a las 23:59:59.999 de ese día. Así, "del 1 al 30 de septiembre" incluye el día 30.
 */
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportes: GenerarReporteService,
    private readonly panel: PanelService,
    private readonly regiones: ReporteRegionesService,
    @Inject(EXPORTADORES)
    private readonly exportadores: readonly ExportadorReporte[],
  ) {}

  /** US-028 y US-030. */
  @Get('solicitudes')
  async solicitudes(
    @Query() q: ReporteSolicitudesQueryDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<Reporte | undefined> {
    const b = new ReporteBuilder();
    if (q.convocatoriaId) b.deConvocatoria(q.convocatoriaId);
    if (q.estado) b.conEstados(q.estado);
    if (q.nivel) b.deNivel(q.nivel);
    if (q.departamento) b.deDepartamento(q.departamento);
    if (q.desde || q.hasta) b.entreFechas(inicioDelDia(q.desde), finDelDia(q.hasta));
    if (q.agruparPor) b.agrupadoPor(q.agruparPor);
    if (q.ordenarPor) b.ordenadoPor(q.ordenarPor);
    if (q.formato) b.enFormato(q.formato);
    const spec = b.build();

    return this.responder(await this.reportes.generar(spec), spec.formato, respuesta);
  }

  /** US-029. */
  @Get('panel')
  estadisticas(@Query() q: ReporteConvocatoriaQueryDto): Promise<PanelDto> {
    return this.panel.calcular(q.convocatoriaId ?? null);
  }

  /** US-031 (y US-030). */
  @Get('regiones')
  async porRegion(
    @Query() q: ReporteConvocatoriaQueryDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<Reporte | undefined> {
    const reporte = await this.regiones.generar(q.convocatoriaId ?? null);
    return this.responder(reporte, q.formato ?? 'JSON', respuesta);
  }

  private responder(reporte: Reporte, formato: string, respuesta: Response): Reporte | undefined {
    if (formato === 'JSON') return reporte;
    const exportador = this.exportadores.find((e) => e.formato === formato);
    if (exportador === undefined) return reporte;

    const fecha = reporte.generadoEn.slice(0, 10);
    respuesta
      .status(200)
      .type(exportador.tipoContenido)
      .setHeader(
        'Content-Disposition',
        `attachment; filename="${reporte.nombre}-${fecha}.${exportador.extension}"`,
      )
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(exportador.exportar(reporte));
    return undefined;
  }
}

/** Guatemala está en UTC-6 todo el año (no usa horario de verano). */
function inicioDelDia(dia?: string): Date | null {
  return dia ? new Date(`${dia}T00:00:00.000-06:00`) : null;
}

function finDelDia(dia?: string): Date | null {
  return dia ? new Date(`${dia}T23:59:59.999-06:00`) : null;
}
