/**
 * Lo que `solicitudes` le ofrece al módulo `reportes` (EPIC-06): filas planas, ya con las fechas
 * que salen del historial (cuándo se resolvió, cuándo se adjudicó). Sin documentos ni motivos.
 */
import { Inject, Injectable } from '@nestjs/common';

import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import {
  FiltroSolicitudesReporte,
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';

export interface FilaSolicitudReporteDto {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly enviadaEn: Date;
  /** Cuándo pasó a APROBADA o RECHAZADA; `null` si todavía no se resuelve. */
  readonly resueltaEn: Date | null;
  readonly adjudicadaEn: Date | null;
  readonly codigoBeca: string | null;
}

export interface FiltroReporteDto {
  readonly convocatoriaId?: string;
  readonly estados?: readonly string[];
  readonly desde?: Date;
  readonly hasta?: Date;
}

@Injectable()
export class SolicitudesParaReportesService {
  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
  ) {}

  async filas(filtro: FiltroReporteDto): Promise<FilaSolicitudReporteDto[]> {
    const f: FiltroSolicitudesReporte = {
      convocatoriaId: filtro.convocatoriaId,
      estados: filtro.estados?.filter((e): e is NombreEstado => e in NombreEstado),
      enviadasDesde: filtro.desde,
      enviadasHasta: filtro.hasta,
    };
    return (await this.repositorio.paraReporte(f)).map(aFila);
  }
}

const RESOLUCIONES: readonly string[] = [NombreEstado.APROBADA, NombreEstado.RECHAZADA];

function aFila(s: Solicitud): FilaSolicitudReporteDto {
  const historial = s.listaHistorial();
  return {
    id: s.id,
    numero: s.numero,
    estado: s.nombreEstado,
    estudianteId: s.estudianteId,
    convocatoriaId: s.convocatoriaId,
    // paraReporte solo devuelve solicitudes enviadas.
    enviadaEn: s.enviadaEn ?? s.creadaEn,
    resueltaEn: historial.find((h) => RESOLUCIONES.includes(h.hacia))?.ocurridoEn ?? null,
    adjudicadaEn: historial.find((h) => h.hacia === NombreEstado.ADJUDICADA)?.ocurridoEn ?? null,
    codigoBeca: s.beca?.codigo ?? null,
  };
}
