/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-021 — Consolidar dictámenes del comité: puntaje de cada solicitud y ranking.
 *
 * CÓMO SE CONSOLIDA
 *   - Puntaje de la solicitud: el promedio de los dictámenes emitidos.
 *   - Ranking: de mayor a menor puntaje, solo entre las que tienen al menos un dictamen. A igual
 *     puntaje, primero la que tiene más dictámenes favorables, después la que se envió antes
 *     (el número de solicitud es correlativo).
 *   - "Dentro de cupos" es orientativo: la decisión es del administrador (US-023) y el cupo lo
 *     controla la adjudicación (US-024). El consolidado no aprueba ni rechaza nada.
 */
import { Inject, Injectable } from '@nestjs/common';

import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import { Recomendacion } from '../../domain/enums/recomendacion.enum';
import { COMITE_REPOSITORIO, ComiteRepositorio } from '../../domain/ports/comite.repositorio';
import {
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_SOLICITUDES,
  ConsultaConvocatoriasEvaluacion,
  ConsultaCuentas,
  ConsultaSolicitudes,
} from '../../domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO, DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';
import { Puntaje } from '../../domain/value-objects/puntaje.vo';
import { ConsolidadoDto, FilaConsolidadoDto } from '../dto/evaluaciones.dto';

@Injectable()
export class ConsolidadoService {
  constructor(
    @Inject(COMITE_REPOSITORIO)
    private readonly comites: ComiteRepositorio,
    @Inject(DICTAMEN_REPOSITORIO)
    private readonly dictamenes: DictamenRepositorio,
    @Inject(CONSULTA_SOLICITUDES)
    private readonly solicitudes: ConsultaSolicitudes,
    @Inject(CONSULTA_CONVOCATORIAS_EVALUACION)
    private readonly convocatorias: ConsultaConvocatoriasEvaluacion,
    @Inject(CONSULTA_CUENTAS)
    private readonly cuentas: ConsultaCuentas,
  ) {}

  async deComite(comiteId: string): Promise<ConsolidadoDto> {
    const comite = await this.comites.buscarPorId(comiteId);
    if (comite === null) {
      throw new RecursoNoEncontradoError('No existe ese comité.');
    }

    const asignaciones = await this.comites.asignacionesDeComite(comite.id);
    const ids = [...new Set(asignaciones.map((a) => a.solicitudId))];
    const [convocatoria, resumenes, dictamenes] = await Promise.all([
      this.convocatorias.buscar(comite.convocatoriaId),
      this.solicitudes.resumenes(ids),
      this.dictamenes.deSolicitudes(ids),
    ]);
    // Un solo mapa para estudiantes Y evaluadores: las filas necesitan el nombre de los dos,
    // y pedirlos por separado serían dos viajes para la misma pregunta.
    const nombres = new Map(
      (
        await this.cuentas.personas([
          ...new Set([
            ...resumenes.map((r) => r.estudianteId),
            ...dictamenes.map((d) => d.evaluadorId),
          ]),
        ])
      ).map((p) => [p.id, p.nombreCompleto]),
    );
    const cupos = convocatoria?.cupos ?? 0;

    const filas = resumenes.map((r) => {
      const propios = dictamenes.filter((d) => d.solicitudId === r.id);
      return {
        solicitudId: r.id,
        numero: r.numero,
        estado: r.estado,
        estudiante: nombres.get(r.estudianteId) ?? 'No disponible',
        evaluadoresAsignados: asignaciones.filter((a) => a.solicitudId === r.id).length,
        dictamenesEmitidos: propios.length,
        puntajePromedio: Puntaje.promedio(propios.map((d) => d.puntaje))?.valor ?? null,
        favorables: propios.filter((d) => d.recomendacion === Recomendacion.FAVORABLE).length,
        desfavorables: propios.filter((d) => d.recomendacion === Recomendacion.DESFAVORABLE).length,
        // El razonamiento de cada evaluador, en el orden en que lo emitieron. Quien resuelve
        // necesita poder leerlo: el motivo de una resolución se apoya en esto, no en un conteo.
        dictamenes: [...propios]
          .sort((a, b) => a.emitidoEn.getTime() - b.emitidoEn.getTime())
          .map((d) => ({
            evaluador: nombres.get(d.evaluadorId) ?? 'No disponible',
            recomendacion: d.recomendacion,
            puntaje: d.puntaje.valor,
            observacion: d.observacion,
            emitidoEn: d.emitidoEn,
          })),
      };
    });

    const ordenadas = filas.sort(
      (a, b) =>
        (b.puntajePromedio ?? -1) - (a.puntajePromedio ?? -1) ||
        b.favorables - a.favorables ||
        a.numero.localeCompare(b.numero),
    );

    let posicion = 0;
    const conRanking: FilaConsolidadoDto[] = ordenadas.map((f) => {
      const lugar = f.puntajePromedio === null ? null : ++posicion;
      return { ...f, posicion: lugar, dentroDeCupos: lugar !== null && lugar <= cupos };
    });

    return {
      comiteId: comite.id,
      convocatoria: convocatoria ? `${convocatoria.titulo} (${convocatoria.codigo})` : '',
      cupos,
      completas: conRanking.filter(
        (f) => f.evaluadoresAsignados > 0 && f.dictamenesEmitidos >= f.evaluadoresAsignados,
      ).length,
      filas: conRanking,
    };
  }
}
