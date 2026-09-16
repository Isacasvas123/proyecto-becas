/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Operaciones compartidas por los casos de uso de solicitudes: cargar una solicitud comprobando
 * que sea del estudiante, y presentarla. Existe para que la regla "un estudiante solo ve sus
 * propias solicitudes" (US-003) esté escrita UNA vez y no copiada en cada caso de uso.
 */
import { Inject, Injectable } from '@nestjs/common';

import {
  AccesoDenegadoError,
  RecursoNoEncontradoError,
} from '../../../../shared/exceptions/errores-dominio';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import {
  CONSULTA_CONVOCATORIAS,
  ConsultaConvocatorias,
} from '../../domain/ports/consultas-externas';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { SolicitudDto } from '../dto/solicitud.dto';
import { aSolicitudDto } from '../mappers/solicitud.mapper';

@Injectable()
export class ExpedienteService {
  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    @Inject(CONSULTA_CONVOCATORIAS)
    private readonly convocatorias: ConsultaConvocatorias,
  ) {}

  /**
   * US-003: si la solicitud existe pero es de otra persona, **403**, no 404. Es el criterio
   * textual de la historia. El id de quien pregunta sale del token, nunca del cliente.
   */
  async cargarPropia(estudianteId: string, solicitudId: string): Promise<Solicitud> {
    const solicitud = await this.repositorio.buscarPorId(solicitudId);

    if (solicitud === null) {
      throw new RecursoNoEncontradoError('No existe esa solicitud.');
    }
    if (!solicitud.perteneceA(estudianteId)) {
      throw new AccesoDenegadoError('No tiene permiso para ver esta solicitud.');
    }
    return solicitud;
  }

  async presentar(solicitud: Solicitud): Promise<SolicitudDto> {
    return aSolicitudDto(solicitud, await this.convocatorias.buscar(solicitud.convocatoriaId));
  }

  async detalle(estudianteId: string, solicitudId: string): Promise<SolicitudDto> {
    return this.presentar(await this.cargarPropia(estudianteId, solicitudId));
  }

  /** US-015. */
  async deEstudiante(estudianteId: string): Promise<SolicitudDto[]> {
    const solicitudes = await this.repositorio.buscarPorEstudiante(estudianteId);
    // Una consulta por solicitud. Un estudiante tiene pocas; si algún día fueran muchas, se
    // cambia por una consulta agrupada sin tocar el contrato.
    return Promise.all(solicitudes.map((s) => this.presentar(s)));
  }
}
