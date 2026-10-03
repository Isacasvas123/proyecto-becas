/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que hace el EVALUADOR: US-019 (evaluar una solicitud, CU-10) y US-020 (ver sus asignadas).
 *
 * QUIÉN PUEDE VER QUÉ
 *   Todo empieza por `asegurarAsignada`: si la solicitud no le fue asignada a este evaluador, la
 *   respuesta es 403 y no se consulta nada más (CU-10, 1a). No se distingue "no existe" de "no es
 *   tuya": para un evaluador, las dos son "no puedes verla".
 *
 * EL PATRÓN STRATEGY EN ACCIÓN
 *   `criterioPara(convocatoria.tipo).calcular(perfil)`. Este servicio no sabe cómo se puntúa
 *   ninguna beca, y no tiene un solo `if` sobre el tipo.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AccesoDenegadoError,
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import { Dictamen } from '../../domain/entities/dictamen.entity';
import { Recomendacion } from '../../domain/enums/recomendacion.enum';
import { COMITE_REPOSITORIO, ComiteRepositorio } from '../../domain/ports/comite.repositorio';
import {
  ArchivoVisible,
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_PERFILES_EVALUACION,
  CONSULTA_SOLICITUDES,
  ConsultaConvocatoriasEvaluacion,
  ConsultaCuentas,
  ConsultaPerfilesEvaluacion,
  ConsultaSolicitudes,
  ExpedienteVisible,
} from '../../domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO, DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';
import { ResultadoCriterio } from '../../domain/strategies/criterio-evaluacion.strategy';
import { criterioPara } from '../../domain/strategies/criterio-por-tipo-beca';
import {
  DictamenDto,
  ExpedienteEvaluacionDto,
  SolicitudAsignadaDto,
} from '../dto/evaluaciones.dto';

/** Solo se dictamina lo que está en evaluación (precondición de CU-10). */
const EN_EVALUACION = 'EN_EVALUACION';

@Injectable()
export class EvaluacionService {
  private readonly logger = new Logger(EvaluacionService.name);

  constructor(
    @Inject(COMITE_REPOSITORIO)
    private readonly comites: ComiteRepositorio,
    @Inject(DICTAMEN_REPOSITORIO)
    private readonly dictamenes: DictamenRepositorio,
    @Inject(CONSULTA_SOLICITUDES)
    private readonly solicitudes: ConsultaSolicitudes,
    @Inject(CONSULTA_CONVOCATORIAS_EVALUACION)
    private readonly convocatorias: ConsultaConvocatoriasEvaluacion,
    @Inject(CONSULTA_PERFILES_EVALUACION)
    private readonly perfiles: ConsultaPerfilesEvaluacion,
    @Inject(CONSULTA_CUENTAS)
    private readonly cuentas: ConsultaCuentas,
  ) {}

  /** US-020: solo las suyas, y cuáles ya dictaminó. Primero las pendientes. */
  async asignadas(evaluadorId: string): Promise<SolicitudAsignadaDto[]> {
    const asignaciones = await this.comites.asignacionesDeEvaluador(evaluadorId);
    const [resumenes, propios] = await Promise.all([
      this.solicitudes.resumenes(asignaciones.map((a) => a.solicitudId)),
      this.dictamenes.deEvaluador(evaluadorId),
    ]);
    const titulos = await this.titulosDe(resumenes.map((r) => r.convocatoriaId));
    const porSolicitud = new Map(resumenes.map((r) => [r.id, r]));
    const dictamenPor = new Map(propios.map((d) => [d.solicitudId, d]));

    return asignaciones
      .filter((a) => porSolicitud.has(a.solicitudId))
      .map((a) => {
        const r = porSolicitud.get(a.solicitudId)!;
        const d = dictamenPor.get(a.solicitudId);
        return {
          solicitudId: r.id,
          numero: r.numero,
          estado: r.estado,
          convocatoria: titulos.get(r.convocatoriaId) ?? '',
          asignadaEn: a.asignadaEn.toISOString(),
          dictaminada: d !== undefined,
          puntaje: d?.puntaje.valor ?? null,
          recomendacion: d?.recomendacion ?? null,
        };
      })
      .sort(
        (x, y) =>
          Number(x.dictaminada) - Number(y.dictaminada) || x.asignadaEn.localeCompare(y.asignadaEn),
      );
  }

  /** US-019, criterio 1: datos del solicitante y documentos. */
  async expediente(evaluadorId: string, solicitudId: string): Promise<ExpedienteEvaluacionDto> {
    await this.asegurarAsignada(evaluadorId, solicitudId);
    const expediente = await this.cargarExpediente(solicitudId);
    const estudianteId = expediente.resumen.estudianteId;

    const [perfil, personas, propio, resultado] = await Promise.all([
      this.perfiles.perfil(estudianteId),
      this.cuentas.personas([estudianteId]),
      this.dictamenes.buscar(solicitudId, evaluadorId),
      this.calcular(expediente),
    ]);

    return {
      solicitudId,
      numero: expediente.resumen.numero,
      estado: expediente.resumen.estado,
      convocatoria: expediente.convocatoriaTitulo,
      solicitante: {
        nombreCompleto: personas[0]?.nombreCompleto ?? 'No disponible',
        centroEducativo: perfil.centroEducativo,
        nivel: perfil.nivel,
        promedio: perfil.promedio,
        ingresoFamiliarMensual: perfil.ingresoFamiliarMensual,
        dependientes: perfil.dependientes,
        departamento: perfil.departamento,
        municipio: perfil.municipio,
      },
      documentos: expediente.documentos,
      calculo:
        'resultado' in resultado
          ? {
              criterio: resultado.resultado.criterio,
              puntaje: resultado.resultado.puntaje.valor,
              desglose: resultado.resultado.desglose,
            }
          : null,
      problemaCalculo: 'problema' in resultado ? resultado.problema : null,
      puedeDictaminar:
        propio === null && expediente.resumen.estado === EN_EVALUACION && 'resultado' in resultado,
      dictamen: propio === null ? null : aDictamenDto(propio),
    };
  }

  /** US-019, criterio 1: abrir cada documento. */
  async documento(
    evaluadorId: string,
    solicitudId: string,
    tipo: string,
  ): Promise<ArchivoVisible | null> {
    await this.asegurarAsignada(evaluadorId, solicitudId);
    return this.solicitudes.documento(solicitudId, tipo);
  }

  /** US-019, criterios 2 a 4. */
  async emitir(
    evaluadorId: string,
    solicitudId: string,
    comando: { recomendacion: Recomendacion; observacion: string },
    ahora: Date = new Date(),
  ): Promise<DictamenDto> {
    await this.asegurarAsignada(evaluadorId, solicitudId);

    if ((await this.dictamenes.buscar(solicitudId, evaluadorId)) !== null) {
      throw new RecursoDuplicadoError('Ya emitió su dictamen para esta solicitud; no se modifica.');
    }

    const expediente = await this.cargarExpediente(solicitudId);
    if (expediente.resumen.estado !== EN_EVALUACION) {
      throw new ReglaDeNegocioError(
        `Solo se dictaminan solicitudes en evaluación; esta está ${expediente.resumen.estado}.`,
      );
    }

    const calculo = await this.calcular(expediente);
    if ('problema' in calculo) {
      throw new ReglaDeNegocioError(calculo.problema);
    }

    const dictamen = Dictamen.emitir({
      id: randomUUID(),
      solicitudId,
      evaluadorId,
      resultado: calculo.resultado,
      recomendacion: comando.recomendacion,
      observacion: comando.observacion,
      ahora,
    });
    await this.dictamenes.crear(dictamen);
    this.logger.log(
      `Dictamen ${dictamen.recomendacion} (${dictamen.puntaje.valor}) sobre ${expediente.resumen.numero}`,
    );
    return aDictamenDto(dictamen);
  }

  private async asegurarAsignada(evaluadorId: string, solicitudId: string): Promise<void> {
    if (!(await this.comites.estaAsignada(solicitudId, evaluadorId))) {
      throw new AccesoDenegadoError('Esta solicitud no le fue asignada.');
    }
  }

  private async cargarExpediente(solicitudId: string): Promise<ExpedienteVisible> {
    const expediente = await this.solicitudes.expediente(solicitudId);
    if (expediente === null) {
      throw new RecursoNoEncontradoError('No existe esa solicitud.');
    }
    return expediente;
  }

  /** El criterio del tipo de beca aplicado al perfil. Un dato faltante no es un error del servidor. */
  private async calcular(
    expediente: ExpedienteVisible,
  ): Promise<{ resultado: ResultadoCriterio } | { problema: string }> {
    const convocatoria = await this.convocatorias.buscar(expediente.resumen.convocatoriaId);
    if (convocatoria === null) {
      return { problema: 'La convocatoria de esta solicitud ya no está disponible.' };
    }
    const perfil = await this.perfiles.perfil(expediente.resumen.estudianteId);
    try {
      return { resultado: criterioPara(convocatoria.tipo).calcular(perfil) };
    } catch (error) {
      if (error instanceof ReglaDeNegocioError) {
        return { problema: error.message };
      }
      throw error;
    }
  }

  private async titulosDe(ids: readonly string[]): Promise<Map<string, string>> {
    const unicos = [...new Set(ids)];
    const convocatorias = await Promise.all(unicos.map((id) => this.convocatorias.buscar(id)));
    return new Map(
      convocatorias.filter((c) => c !== null).map((c) => [c.id, `${c.titulo} (${c.codigo})`]),
    );
  }
}

export function aDictamenDto(d: Dictamen): DictamenDto {
  return {
    criterio: d.criterio,
    puntaje: d.puntaje.valor,
    desglose: d.desglose,
    recomendacion: d.recomendacion,
    observacion: d.observacion,
    emitidoEn: d.emitidoEn.toISOString(),
  };
}
