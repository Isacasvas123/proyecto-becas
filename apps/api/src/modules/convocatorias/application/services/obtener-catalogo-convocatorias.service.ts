/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que el formulario de creación necesita saber: qué requisitos y documentos existen, y
 * cuáles trae por defecto cada tipo de beca.
 *
 * LA DECISIÓN IMPORTANTE: los valores por defecto se le PREGUNTAN A LAS FÁBRICAS, no se
 * copian al frontend. Si el frontend tuviera su propia lista, el día que el Ministerio cambie
 * los documentos de posgrado habría dos listas y una de ellas estaría mal. Así hay una sola
 * fuente de verdad, y es la misma que usa el servidor al crear.
 */
import { Injectable } from '@nestjs/common';

import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
import { FABRICAS_CONVOCATORIA } from '../../domain/factories/convocatoria.factory';
import { ElementoCatalogoDto } from '../dto/convocatoria-listada.dto';
import { aDocumentoDto, aRequisitoDto } from '../mappers/convocatoria.mapper';

export interface CatalogoConvocatoriasDto {
  readonly requisitos: readonly ElementoCatalogoDto[];
  readonly documentos: readonly ElementoCatalogoDto[];
  readonly tipos: readonly {
    readonly tipo: TipoBeca;
    readonly requisitosPorDefecto: readonly string[];
    readonly documentosPorDefecto: readonly string[];
  }[];
}

@Injectable()
export class ObtenerCatalogoConvocatoriasService {
  ejecutar(): CatalogoConvocatoriasDto {
    return {
      requisitos: Object.values(Requisito).map(aRequisitoDto),
      documentos: Object.values(TipoDocumento).map(aDocumentoDto),
      tipos: Object.values(FABRICAS_CONVOCATORIA).map((fabrica) => ({
        tipo: fabrica.tipo(),
        requisitosPorDefecto: [...fabrica.requisitosPorDefecto()],
        documentosPorDefecto: [...fabrica.documentosPorDefecto()],
      })),
    };
  }
}
