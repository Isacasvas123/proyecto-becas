/**
 * Lo que necesita el formulario de creación: qué requisitos y documentos existen y cuáles trae
 * por defecto cada tipo de beca.
 *
 * Los valores por defecto se piden a las fábricas y no se copian al frontend. Con dos listas, el
 * día que cambien los documentos de posgrado una quedaría mal. Así hay una sola fuente de verdad,
 * la misma que usa el servidor al crear.
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
