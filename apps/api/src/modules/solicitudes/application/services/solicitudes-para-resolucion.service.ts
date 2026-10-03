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
      await this.repositorio.guardar(solicitud);
    }
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
    return aDto(solicitud);
  }

  ocupacion(convocatoriaId: string) {
    return this.repositorio.contarOcupacion(convocatoriaId);
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
