/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que `solicitudes` le ofrece al módulo `resoluciones` (EPIC-05). Igual que la puerta de
 * `evaluaciones`: no comprueba quién llama. Lo usan solo casos de uso que ya lo verificaron (la
 * fachada de resolución exige ADMINISTRADOR) o que no exponen nada personal (la consulta pública).
 */
import { Inject, Injectable } from '@nestjs/common';

import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { Decision, NombreEstado } from '../../domain/enums/solicitud.enums';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { PublicadorEventosSolicitud } from './publicador-eventos.service';

export interface SolicitudParaResolverDto {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly ultimoCambio: string;
  readonly beca: { readonly codigo: string; readonly otorgadaEn: string } | null;
}

@Injectable()
export class SolicitudesParaResolucionService {
  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    private readonly eventos: PublicadorEventosSolicitud,
  ) {}

  async resumen(id: string): Promise<SolicitudParaResolverDto | null> {
    const solicitud = await this.repositorio.buscarPorId(id);
    return solicitud === null ? null : aDto(solicitud);
  }

  async porNumero(numero: string): Promise<SolicitudParaResolverDto | null> {
    const solicitud = await this.repositorio.buscarPorNumero(numero);
    return solicitud === null ? null : aDto(solicitud);
  }

  /**
   * US-023. Aprobar ocupa un cupo: se guarda con la comprobación atómica del repositorio. Rechazar
   * no ocupa nada. La transición la valida el patrón State (solo desde EN_EVALUACION) y queda en
   * el historial con autor, fecha y motivo.
   */
  async resolver(
    id: string,
    decision: 'APROBAR' | 'RECHAZAR',
    motivo: string,
    autorId: string,
    cupos: number,
    ahora: Date = new Date(),
  ): Promise<SolicitudParaResolverDto> {
    const solicitud = await this.cargar(id);
    solicitud.resolver(Decision[decision], ahora, autorId, motivo);
    if (solicitud.nombreEstado === NombreEstado.APROBADA) {
      await this.repositorio.guardarSiHayCupo(solicitud, cupos);
    } else {
      // Incluye APROBACION_PENDIENTE: la primera firma NO reserva cupo (PO, 17 Oct 2026). Si lo
      // hiciera, una solicitud grande podría retener un cupo durante días esperando la segunda
      // firma, y si al final se rechaza nadie habría podido usarlo.
      await this.repositorio.guardar(solicitud);
    }
    await this.eventos.publicarDe(solicitud);
    return aDto(solicitud);
  }

  /**
   * Segunda aprobación (PO, 17 de octubre de 2026).
   *
   * El cupo se reserva **aquí**, con la misma comprobación atómica que una aprobación normal:
   * entre la primera firma y la segunda pueden haberse agotado los cupos, y en ese caso esta
   * solicitud no entra. Quien firma segundo se entera en ese momento, no después.
   */
  async confirmarAprobacion(
    id: string,
    motivo: string,
    autorId: string,
    cupos: number,
    ahora: Date = new Date(),
  ): Promise<SolicitudParaResolverDto> {
    const solicitud = await this.cargar(id);
    solicitud.confirmarAprobacion(ahora, autorId, motivo);
    await this.repositorio.guardarSiHayCupo(solicitud, cupos);
    await this.eventos.publicarDe(solicitud);
    return aDto(solicitud);
  }

  /** US-024. Código correlativo por año: BECA-2026-000001. */
  async adjudicar(
    id: string,
    autorId: string,
    ahora: Date = new Date(),
  ): Promise<SolicitudParaResolverDto> {
    const solicitud = await this.cargar(id);
    const prefijo = `BECA-${ahora.getUTCFullYear()}-`;
    const correlativo = (await this.repositorio.contarBecasConPrefijo(prefijo)) + 1;
    solicitud.adjudicar(ahora, autorId, `${prefijo}${String(correlativo).padStart(6, '0')}`);
    await this.repositorio.guardar(solicitud);
    await this.eventos.publicarDe(solicitud);
    return aDto(solicitud);
  }

  ocupacion(convocatoriaId: string) {
    return this.repositorio.contarOcupacion(convocatoriaId);
  }

  tieneBecaAdjudicada(estudianteId: string, exceptoSolicitudId: string) {
    return this.repositorio.tieneBecaAdjudicada(estudianteId, exceptoSolicitudId);
  }

  /** La misma cuenta para varias convocatorias, en un solo viaje a la base. */
  ocupacionDe(convocatoriaIds: readonly string[]) {
    return this.repositorio.contarOcupacionDe(convocatoriaIds);
  }

  private async cargar(id: string): Promise<Solicitud> {
    const solicitud = await this.repositorio.buscarPorId(id);
    if (solicitud === null) {
      throw new RecursoNoEncontradoError('No existe esa solicitud.');
    }
    return solicitud;
  }
}

function aDto(s: Solicitud): SolicitudParaResolverDto {
  return {
    id: s.id,
    numero: s.numero,
    estado: s.nombreEstado,
    estudianteId: s.estudianteId,
    convocatoriaId: s.convocatoriaId,
    ultimoCambio: s.ultimoCambio.toISOString(),
    beca:
      s.beca === null
        ? null
        : { codigo: s.beca.codigo, otorgadaEn: s.beca.otorgadaEn.toISOString() },
  };
}
