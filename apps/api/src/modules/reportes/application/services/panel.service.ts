/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-029 — Panel de estadísticas: solicitudes recibidas, tasa de aprobación, cupos disponibles y
 * tiempo promedio de resolución. Para todo el programa o para una convocatoria.
 *
 * CÓMO SE CALCULA CADA INDICADOR
 *   - Recibidas: todas las enviadas (los borradores no cuentan).
 *   - Tasa de aprobación: (aprobadas + adjudicadas) ÷ resueltas. Las que siguen en evaluación NO
 *     entran en el denominador: todavía no tienen decisión. Sin resueltas, no hay tasa (`null`).
 *   - Cupos disponibles: cupos de las convocatorias no borrador − aprobadas − adjudicadas. Es la
 *     misma regla con la que se aprueba (US-023): aprobar reserva el cupo.
 *   - Tiempo promedio de resolución: días entre el envío y la aprobación o rechazo.
 */
import { Inject, Injectable } from '@nestjs/common';

import {
  FUENTE_CONVOCATORIAS,
  FUENTE_SOLICITUDES,
  FuenteConvocatorias,
  FuenteSolicitudes,
  SolicitudReportable,
} from '../../domain/ports/puertos';
import { dias } from '../nombres';

export interface IndicadoresDto {
  readonly recibidas: number;
  readonly enEvaluacion: number;
  readonly pendientesDeAsignar: number;
  readonly aprobadas: number;
  readonly rechazadas: number;
  readonly adjudicadas: number;
  readonly tasaAprobacion: number | null;
  readonly cuposTotales: number;
  readonly cuposDisponibles: number;
  readonly diasPromedioResolucion: number | null;
}

export interface PanelDto extends IndicadoresDto {
  readonly generadoEn: string;
  readonly convocatorias: readonly (IndicadoresDto & {
    readonly id: string;
    readonly codigo: string;
    readonly titulo: string;
    readonly estado: string;
  })[];
}

@Injectable()
export class PanelService {
  constructor(
    @Inject(FUENTE_SOLICITUDES)
    private readonly solicitudes: FuenteSolicitudes,
    @Inject(FUENTE_CONVOCATORIAS)
    private readonly convocatorias: FuenteConvocatorias,
  ) {}

  async calcular(convocatoriaId: string | null, ahora: Date = new Date()): Promise<PanelDto> {
    const convocatorias = (await this.convocatorias.todas()).filter(
      (c) => c.estado !== 'BORRADOR' && (convocatoriaId === null || c.id === convocatoriaId),
    );
    const recibidas = await this.solicitudes.recibidas({
      convocatoriaId: convocatoriaId ?? undefined,
    });

    const porConvocatoria = convocatorias
      .map((c) => ({
        id: c.id,
        codigo: c.codigo,
        titulo: c.titulo,
        estado: c.estado,
        ...indicadores(
          recibidas.filter((s) => s.convocatoriaId === c.id),
          c.cupos,
        ),
      }))
      .sort((a, b) => b.recibidas - a.recibidas || a.codigo.localeCompare(b.codigo));

    return {
      generadoEn: ahora.toISOString(),
      ...indicadores(
        recibidas,
        convocatorias.reduce((suma, c) => suma + c.cupos, 0),
      ),
      convocatorias: porConvocatoria,
    };
  }
}

export function indicadores(
  solicitudes: readonly SolicitudReportable[],
  cupos: number,
): IndicadoresDto {
  const contar = (estado: string) => solicitudes.filter((s) => s.estado === estado).length;
  const aprobadas = contar('APROBADA');
  const adjudicadas = contar('ADJUDICADA');
  const rechazadas = contar('RECHAZADA');
  const resueltas = aprobadas + adjudicadas + rechazadas;
  const tiempos = solicitudes
    .filter((s) => s.resueltaEn !== null)
    .map((s) => dias(s.enviadaEn, s.resueltaEn as Date));

  return {
    recibidas: solicitudes.length,
    pendientesDeAsignar: contar('ENVIADA'),
    enEvaluacion: contar('EN_EVALUACION'),
    aprobadas,
    rechazadas,
    adjudicadas,
    tasaAprobacion:
      resueltas === 0 ? null : Math.round(((aprobadas + adjudicadas) / resueltas) * 1000) / 10,
    cuposTotales: cupos,
    cuposDisponibles: Math.max(0, cupos - aprobadas - adjudicadas),
    diasPromedioResolucion:
      tiempos.length === 0
        ? null
        : Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 10) / 10,
  };
}
