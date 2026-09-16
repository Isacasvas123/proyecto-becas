/**
 * CAPA: application/facades/  ·  PATRÓN FACADE (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * Justificación en docs/06-patrones.md §4.
 *
 * Resolver una solicitud (US-023) coordina a varios colaboradores que viven en módulos distintos:
 *
 *     dictámenes (evaluaciones) ─┐
 *     cupos (convocatorias) ─────┼──▶  ResolucionFacade.resolver(...)  ◀── controlador
 *     transición e historial ────┤         una sola operación
 *       (solicitudes, State)     │
 *     aviso al estudiante ───────┘
 *
 * El controlador llama a UN método y no sabe nada de eso. Sin la fachada, esas reglas quedarían
 * en el controlador —lógica de negocio en presentación— y se repetirían en cada punto de entrada
 * que un día resuelva solicitudes (una importación masiva, por ejemplo).
 *
 * EL ORDEN IMPORTA
 *   1. Validaciones que no cambian nada: existe, tiene dictámenes, hay cupo (para mostrar un buen
 *      mensaje antes de intentar).
 *   2. La transición, que es la única escritura y es atómica (incluye la comprobación real del
 *      cupo y el historial con autor, fecha y motivo).
 *   3. El aviso. Si falla, la resolución YA está hecha y no se deshace.
 *
 * ALCANCE
 *   El acta de resolución (US-026) no está: cuando exista, será un colaborador más de esta fachada,
 *   sin tocar el controlador.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import {
  CONSULTA_CONVOCATORIAS_RESOLUCION,
  CONSULTA_DICTAMENES,
  CONSULTA_SOLICITUDES_RESOLUCION,
  ConsultaConvocatoriasResolucion,
  ConsultaDictamenes,
  ConsultaSolicitudesResolucion,
  ConvocatoriaResoluble,
  Decision,
  SolicitudResoluble,
} from '../../domain/ports/consultas-externas';
import {
  NOTIFICADOR_RESOLUCIONES,
  NotificadorResoluciones,
} from '../../domain/ports/notificador-resoluciones';
import { OcupacionCupos } from '../../domain/value-objects/ocupacion-cupos.vo';

/** Largo mínimo del motivo: "no" no explica una decisión sobre fondos públicos. */
export const LARGO_MINIMO_MOTIVO = 15;

export interface CuposDto {
  readonly convocatoriaId: string;
  readonly cupos: number;
  readonly aprobadas: number;
  readonly adjudicadas: number;
  readonly disponibles: number;
}

export interface ResultadoResolucionDto {
  readonly solicitudId: string;
  readonly numero: string;
  readonly estado: string;
  readonly beca: { readonly codigo: string; readonly otorgadaEn: string } | null;
  readonly cupos: CuposDto;
}

@Injectable()
export class ResolucionFacade {
  private readonly logger = new Logger(ResolucionFacade.name);

  constructor(
    @Inject(CONSULTA_SOLICITUDES_RESOLUCION)
    private readonly solicitudes: ConsultaSolicitudesResolucion,
    @Inject(CONSULTA_DICTAMENES)
    private readonly dictamenes: ConsultaDictamenes,
    @Inject(CONSULTA_CONVOCATORIAS_RESOLUCION)
    private readonly convocatorias: ConsultaConvocatoriasResolucion,
    @Inject(NOTIFICADOR_RESOLUCIONES)
    private readonly notificador: NotificadorResoluciones,
  ) {}

  /** US-023. */
  async resolver(
    solicitudId: string,
    decision: Decision,
    motivo: string,
    adminId: string,
  ): Promise<ResultadoResolucionDto> {
    // Criterio 2: el motivo es obligatorio en los dos sentidos.
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < LARGO_MINIMO_MOTIVO) {
      throw new ReglaDeNegocioError(
        `Escriba el motivo de la decisión (al menos ${LARGO_MINIMO_MOTIVO} caracteres). Es obligatorio para aprobar y para rechazar.`,
      );
    }

    const solicitud = await this.cargarSolicitud(solicitudId);

    // Criterio 1.
    const { total } = await this.dictamenes.resumen(solicitud.id);
    if (total === 0) {
      throw new ReglaDeNegocioError(
        `La solicitud ${solicitud.numero} no tiene ningún dictamen. Espere al menos uno antes de resolver.`,
      );
    }

    // Criterio 4, primera comprobación (la definitiva es atómica, en el repositorio).
    const convocatoria = await this.cargarConvocatoria(solicitud.convocatoriaId);
    if (decision === 'APROBAR') {
      (await this.ocupacion(convocatoria)).asegurarCupoParaAprobar();
    }

    // Criterio 3: el patrón State valida la transición y la anota con autor y fecha.
    const resuelta = await this.solicitudes.resolver(
      solicitud.id,
      decision,
      motivoLimpio,
      adminId,
      convocatoria.cupos,
    );
    this.logger.log(`${resuelta.numero} → ${resuelta.estado} por ${adminId}`);

    await this.avisar(resuelta, motivoLimpio);
    return this.resultado(resuelta, convocatoria);
  }

  /** US-024. Solo una solicitud APROBADA (lo garantiza el patrón State). */
  async adjudicar(solicitudId: string, adminId: string): Promise<ResultadoResolucionDto> {
    const solicitud = await this.cargarSolicitud(solicitudId);
    const convocatoria = await this.cargarConvocatoria(solicitud.convocatoriaId);

    const adjudicada = await this.solicitudes.adjudicar(solicitud.id, adminId);
    this.logger.log(`${adjudicada.numero} adjudicada: ${adjudicada.beca?.codigo} por ${adminId}`);

    await this.avisar(adjudicada, null);
    return this.resultado(adjudicada, convocatoria);
  }

  async cupos(convocatoriaId: string): Promise<CuposDto> {
    return aCuposDto(
      await this.ocupacion(await this.cargarConvocatoria(convocatoriaId)),
      convocatoriaId,
    );
  }

  private async ocupacion(convocatoria: ConvocatoriaResoluble): Promise<OcupacionCupos> {
    const { aprobadas, adjudicadas } = await this.solicitudes.ocupacion(convocatoria.id);
    return new OcupacionCupos(convocatoria.cupos, aprobadas, adjudicadas);
  }

  private async resultado(
    s: SolicitudResoluble,
    convocatoria: ConvocatoriaResoluble,
  ): Promise<ResultadoResolucionDto> {
    return {
      solicitudId: s.id,
      numero: s.numero,
      estado: s.estado,
      beca: s.beca,
      cupos: aCuposDto(await this.ocupacion(convocatoria), convocatoria.id),
    };
  }

  private async avisar(s: SolicitudResoluble, motivo: string | null): Promise<void> {
    await this.notificador
      .cambioDeEstado({
        estudianteId: s.estudianteId,
        numero: s.numero,
        estado: s.estado,
        motivo,
        codigoBeca: s.beca?.codigo ?? null,
      })
      .catch((error: unknown) => {
        this.logger.error(`No se pudo avisar el cambio de ${s.numero}: ${String(error)}`);
      });
  }

  private async cargarSolicitud(id: string): Promise<SolicitudResoluble> {
    const solicitud = await this.solicitudes.buscar(id);
    if (solicitud === null) {
      throw new RecursoNoEncontradoError('No existe esa solicitud.');
    }
    return solicitud;
  }

  private async cargarConvocatoria(id: string): Promise<ConvocatoriaResoluble> {
    const convocatoria = await this.convocatorias.buscar(id);
    if (convocatoria === null) {
      throw new RecursoNoEncontradoError('No existe la convocatoria de esta solicitud.');
    }
    return convocatoria;
  }
}

function aCuposDto(o: OcupacionCupos, convocatoriaId: string): CuposDto {
  return {
    convocatoriaId,
    cupos: o.cupos,
    aprobadas: o.aprobadas,
    adjudicadas: o.adjudicadas,
    disponibles: o.disponibles,
  };
}
