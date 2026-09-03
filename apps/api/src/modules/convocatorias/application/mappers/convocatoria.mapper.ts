/**
 * CAPA: application/
 *
 * Traduce la entidad de dominio al DTO de salida. Una sola responsabilidad (SOLID · S) y
 * un solo lugar donde cambiar el formato de las fechas del contrato público.
 */
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { ConvocatoriaListadaDto } from '../dto/convocatoria-listada.dto';

export function aConvocatoriaListadaDto(convocatoria: Convocatoria): ConvocatoriaListadaDto {
  return {
    id: convocatoria.id,
    codigo: convocatoria.codigo,
    titulo: convocatoria.titulo,
    descripcion: convocatoria.descripcion,
    tipo: convocatoria.tipo,
    estado: convocatoria.estado,
    cupos: convocatoria.cupos,
    // ISO-8601 en el contrato: sin ambigüedad de zona horaria para el frontend.
    fechaApertura: convocatoria.periodo.apertura.toISOString(),
    fechaCierre: convocatoria.periodo.cierre.toISOString(),
  };
}
