/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que OTROS módulos pueden saber de una convocatoria.
 *
 * Es la puerta que usa `solicitudes` (EPIC-03) para preguntar si una convocatoria admite
 * postulaciones y qué documentos exige. Devuelve datos planos y no la entidad: si `solicitudes`
 * recibiera `Convocatoria`, podría llamar a `publicar()` sobre ella y saltarse este módulo.
 * Es la mitigación del riesgo nº4 de docs/05-arquitectura.md §2.2 ("monolito distribuido
 * interno"): los módulos se hablan por la capa de aplicación, nunca por el dominio ajeno.
 */
import { Inject, Injectable } from '@nestjs/common';

import {
  CONVOCATORIA_REPOSITORIO,
  ConvocatoriaRepositorio,
} from '../../domain/ports/convocatoria.repositorio';
import { ElementoCatalogoDto } from '../dto/convocatoria-listada.dto';
import { aDocumentoDto } from '../mappers/convocatoria.mapper';

export interface ConvocatoriaParaPostulacionDto {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  /** Decide el criterio de evaluación (US-019). */
  readonly tipo: string;
  /** Tope de adjudicaciones; el consolidado lo usa como referencia (US-021). */
  readonly cupos: number;
  /** Monto de la beca (PO, 17 Oct 2026): decide si hara falta segunda aprobacion. */
  readonly montoBeca: number;
  /** La regla es de ESTE módulo: publicada y dentro del plazo (`Convocatoria.admiteSolicitudes`). */
  readonly admiteSolicitudes: boolean;
  readonly fechaCierre: Date;
  readonly documentosExigidos: readonly ElementoCatalogoDto[];
}

/** Para reportes (EPIC-06): lo mínimo de cada convocatoria. */
export interface ConvocatoriaResumidaDto {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly tipo: string;
  readonly estado: string;
  readonly cupos: number;
}

@Injectable()
export class ConsultarConvocatoriaService {
  constructor(
    @Inject(CONVOCATORIA_REPOSITORIO)
    private readonly repositorio: ConvocatoriaRepositorio,
  ) {}

  async resumenes(): Promise<ConvocatoriaResumidaDto[]> {
    return (await this.repositorio.buscarTodas()).map((c) => ({
      id: c.id,
      codigo: c.codigo,
      titulo: c.titulo,
      tipo: c.tipo,
      estado: c.estado,
      cupos: c.cupos,
    }));
  }

  async paraPostulacion(
    id: string,
    ahora: Date = new Date(),
  ): Promise<ConvocatoriaParaPostulacionDto | null> {
    const convocatoria = await this.repositorio.buscarPorId(id);

    if (convocatoria === null) {
      return null;
    }

    return {
      id: convocatoria.id,
      codigo: convocatoria.codigo,
      titulo: convocatoria.titulo,
      tipo: convocatoria.tipo,
      cupos: convocatoria.cupos,
      montoBeca: convocatoria.montoBeca,
      admiteSolicitudes: convocatoria.admiteSolicitudes(ahora),
      fechaCierre: convocatoria.periodo.cierre,
      documentosExigidos: convocatoria.documentosExigidos.map(aDocumentoDto),
    };
  }
}
