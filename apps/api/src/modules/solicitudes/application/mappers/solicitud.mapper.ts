import { Solicitud } from '../../domain/entities/solicitud.entity';
import { ConvocatoriaDeSolicitud } from '../../domain/ports/consultas-externas';
import { SolicitudDto } from '../dto/solicitud.dto';

/**
 * `convocatoria` puede ser `null` si se borró —hoy no se puede borrar ninguna—. La solicitud se
 * muestra igual: el expediente de una persona no puede desaparecer porque falte un dato ajeno.
 */
export function aSolicitudDto(
  solicitud: Solicitud,
  convocatoria: ConvocatoriaDeSolicitud | null,
): SolicitudDto {
  const descripcion = new Map(
    (convocatoria?.documentosExigidos ?? []).map((d) => [d.codigo, d.descripcion]),
  );
  const nombre = (tipo: string) => descripcion.get(tipo) ?? tipo;

  return {
    id: solicitud.id,
    numero: solicitud.numero,
    estado: solicitud.nombreEstado,
    editable: solicitud.esEditable(),
    convocatoria: {
      id: solicitud.convocatoriaId,
      codigo: convocatoria?.codigo ?? '',
      titulo: convocatoria?.titulo ?? 'Convocatoria no disponible',
      fechaCierre: convocatoria?.fechaCierre.toISOString() ?? null,
    },
    documentos: solicitud.documentosExigidos.map((tipo) => {
      const d = solicitud.documento(tipo);
      return {
        tipo,
        descripcion: nombre(tipo),
        cargado: d !== null,
        nombreArchivo: d?.nombreArchivo ?? null,
        tamanoBytes: d?.tamanoBytes ?? null,
        cargadoEn: d?.cargadoEn.toISOString() ?? null,
      };
    }),
    documentosFaltantes: solicitud.documentosFaltantes().map(nombre),
    historial: solicitud.listaHistorial().map((h) => ({
      desde: h.desde,
      hacia: h.hacia,
      motivo: h.motivo,
      ocurridoEn: h.ocurridoEn.toISOString(),
    })),
    creadaEn: solicitud.creadaEn.toISOString(),
    enviadaEn: solicitud.enviadaEn?.toISOString() ?? null,
    beca:
      solicitud.beca === null
        ? null
        : { codigo: solicitud.beca.codigo, otorgadaEn: solicitud.beca.otorgadaEn.toISOString() },
  };
}
