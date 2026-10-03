/**
 * Lo que los casos de uso de `solicitudes` devuelven. Datos planos: nunca la entidad.
 */
export interface DocumentoDeSolicitudDto {
  readonly tipo: string;
  readonly descripcion: string;
  readonly cargado: boolean;
  readonly nombreArchivo: string | null;
  readonly tamanoBytes: number | null;
  readonly cargadoEn: string | null;
}

export interface EntradaHistorialDto {
  readonly desde: string | null;
  readonly hacia: string;
  readonly motivo: string | null;
  readonly ocurridoEn: string;
}

export interface SolicitudDto {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly editable: boolean;
  readonly convocatoria: {
    readonly id: string;
    readonly codigo: string;
    readonly titulo: string;
    readonly fechaCierre: string | null;
  };
  /** Uno por cada documento que exige la convocatoria, cargado o no (US-012, criterio 4). */
  readonly documentos: readonly DocumentoDeSolicitudDto[];
  readonly documentosFaltantes: readonly string[];
  /** US-016: la línea de tiempo. No incluye el id del autor: no le sirve al estudiante. */
  readonly historial: readonly EntradaHistorialDto[];
  readonly creadaEn: string;
  readonly enviadaEn: string | null;
  /** US-024: el código de la beca, si se le adjudicó. */
  readonly beca: { readonly codigo: string; readonly otorgadaEn: string } | null;
}
