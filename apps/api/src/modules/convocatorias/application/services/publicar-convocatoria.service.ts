/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-007 — Publicar convocatoria.
 *
 * Es un caso de uso corto a propósito: busca, le pide a la entidad que se publique y guarda.
 * Las reglas —solo desde BORRADOR, con al menos un requisito y un documento— viven en
 * `Convocatoria.publicar()`, no aquí. Un servicio que empieza a validar reglas del negocio
 * es un servicio que le está robando responsabilidad a la entidad.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import {
  CONVOCATORIA_REPOSITORIO,
  ConvocatoriaRepositorio,
} from '../../domain/ports/convocatoria.repositorio';
import { ConvocatoriaListadaDto } from '../dto/convocatoria-listada.dto';
import { aConvocatoriaListadaDto } from '../mappers/convocatoria.mapper';

@Injectable()
export class PublicarConvocatoriaService {
  private readonly logger = new Logger(PublicarConvocatoriaService.name);

  constructor(
    @Inject(CONVOCATORIA_REPOSITORIO)
    private readonly repositorio: ConvocatoriaRepositorio,
  ) {}

  async ejecutar(id: string): Promise<ConvocatoriaListadaDto> {
    const convocatoria = await this.repositorio.buscarPorId(id);

    if (convocatoria === null) {
      throw new RecursoNoEncontradoError('No existe una convocatoria con ese identificador.');
    }

    convocatoria.publicar();
    await this.repositorio.guardar(convocatoria);
    this.logger.log(`Convocatoria publicada: ${convocatoria.codigo}`);

    return aConvocatoriaListadaDto(convocatoria);
  }
}
