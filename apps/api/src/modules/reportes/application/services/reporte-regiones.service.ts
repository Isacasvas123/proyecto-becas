/**
 * US-031: becas adjudicadas por región. Pide el mismo builder (solo adjudicadas, por
 * departamento) y lo reordena en una tabla con los 22 departamentos. Los que no tienen becas
 * aparecen en cero: para evaluar la equidad territorial importa ver dónde no llegó ninguna.
 */
import { Inject, Injectable } from '@nestjs/common';

import { FUENTE_PERFILES, FuentePerfiles } from '../../domain/ports/puertos';
import { Reporte } from '../../domain/reporte';
import { ReporteBuilder } from '../builders/reporte.builder';
import { SIN_DATO } from '../nombres';
import { GenerarReporteService } from './generar-reporte.service';

@Injectable()
export class ReporteRegionesService {
  constructor(
    private readonly reportes: GenerarReporteService,
    @Inject(FUENTE_PERFILES)
    private readonly perfiles: FuentePerfiles,
  ) {}

  async generar(convocatoriaId: string | null, ahora: Date = new Date()): Promise<Reporte> {
    const builder = new ReporteBuilder().conEstados(['ADJUDICADA']).agrupadoPor('DEPARTAMENTO');
    if (convocatoriaId !== null) builder.deConvocatoria(convocatoriaId);

    const base = await this.reportes.generar(builder.build(), ahora);
    const porCodigo = new Map((base.grupos ?? []).map((g) => [g.clave, g.total]));
    const total = base.total;
    const porcentaje = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

    const filas = this.perfiles
      .departamentos()
      .map((d) => ({ departamento: d.nombre, becas: porCodigo.get(d.codigo) ?? 0 }))
      .sort((a, b) => b.becas - a.becas || a.departamento.localeCompare(b.departamento))
      .map((f) => ({ ...f, porcentaje: porcentaje(f.becas) }));

    const sinDato = porCodigo.get('—') ?? 0;
    if (sinDato > 0) {
      filas.push({ departamento: SIN_DATO, becas: sinDato, porcentaje: porcentaje(sinDato) });
    }

    return {
      titulo: 'Becas adjudicadas por departamento',
      nombre: 'reporte-regiones',
      generadoEn: base.generadoEn,
      filtros: [
        ...base.filtros.filter((f) => f.etiqueta !== 'Estado'),
        {
          etiqueta: 'Departamentos sin becas',
          valor: String(filas.filter((f) => f.becas === 0).length),
        },
      ],
      columnas: [
        { clave: 'departamento', titulo: 'Departamento' },
        { clave: 'becas', titulo: 'Becas adjudicadas', numerica: true },
        { clave: 'porcentaje', titulo: '% del total', numerica: true },
      ],
      filas,
      agrupacion: null,
      grupos: null,
      total,
    };
  }
}
