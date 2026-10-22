import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { DESCRIPCION_REQUISITO, Requisito } from '../../domain/enums/requisito.enum';
import { DESCRIPCION_DOCUMENTO, TipoDocumento } from '../../domain/enums/tipo-documento.enum';
import { ConvocatoriaListadaDto, ElementoCatalogoDto } from '../dto/convocatoria-listada.dto';

export function aConvocatoriaListadaDto(convocatoria: Convocatoria): ConvocatoriaListadaDto {
  return {
    id: convocatoria.id,
    codigo: convocatoria.codigo,
    titulo: convocatoria.titulo,
    descripcion: convocatoria.descripcion,
    tipo: convocatoria.tipo,
    estado: convocatoria.estado,
    cupos: convocatoria.cupos,
    montoBeca: convocatoria.montoBeca,
    exigeSegundaAprobacion: convocatoria.exigeSegundaAprobacion(),
    // ISO-8601 en el contrato: sin ambigüedad de zona horaria para el frontend.
    fechaApertura: convocatoria.periodo.apertura.toISOString(),
    fechaCierre: convocatoria.periodo.cierre.toISOString(),
    requisitos: convocatoria.requisitos.map(aRequisitoDto),
    documentosExigidos: convocatoria.documentosExigidos.map(aDocumentoDto),
  };
}

export function aRequisitoDto(requisito: Requisito): ElementoCatalogoDto {
  return { codigo: requisito, descripcion: DESCRIPCION_REQUISITO[requisito] };
}

export function aDocumentoDto(documento: TipoDocumento): ElementoCatalogoDto {
  return { codigo: documento, descripcion: DESCRIPCION_DOCUMENTO[documento] };
}
