/**
 * Lo que `evaluaciones` le ofrece a `resoluciones` (EPIC-05): cuántos dictámenes tiene una
 * solicitud y en qué sentido. No expone observaciones ni desgloses, que no hacen falta para
 * resolver y son del expediente de evaluación.
 */
import { Inject, Injectable } from '@nestjs/common';

import { Recomendacion } from '../../domain/enums/recomendacion.enum';
import { DICTAMEN_REPOSITORIO, DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';
import { Puntaje } from '../../domain/value-objects/puntaje.vo';

export interface ResumenDictamenesDto {
  readonly total: number;
  readonly favorables: number;
  readonly desfavorables: number;
  readonly puntajePromedio: number | null;
}

@Injectable()
export class DictamenesDeSolicitudService {
  constructor(
    @Inject(DICTAMEN_REPOSITORIO)
    private readonly dictamenes: DictamenRepositorio,
  ) {}

  async resumen(solicitudId: string): Promise<ResumenDictamenesDto> {
    const lista = await this.dictamenes.deSolicitudes([solicitudId]);
    return {
      total: lista.length,
      favorables: lista.filter((d) => d.recomendacion === Recomendacion.FAVORABLE).length,
      desfavorables: lista.filter((d) => d.recomendacion === Recomendacion.DESFAVORABLE).length,
      puntajePromedio: Puntaje.promedio(lista.map((d) => d.puntaje))?.valor ?? null,
    };
  }
}
