/**
 * Puertos de `reportes`. Los tres primeros son los otros módulos (se leen por sus servicios
 * exportados, nunca por sus tablas); el último, los formatos de salida.
 */
import { Reporte } from '../reporte';

export const FUENTE_SOLICITUDES = Symbol('FuenteSolicitudes');
export const FUENTE_PERFILES = Symbol('FuentePerfiles');
export const FUENTE_CONVOCATORIAS = Symbol('FuenteConvocatorias');
export const EXPORTADORES = Symbol('Exportadores');

export interface SolicitudReportable {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly enviadaEn: Date;
  readonly resueltaEn: Date | null;
  readonly adjudicadaEn: Date | null;
  readonly codigoBeca: string | null;
}

export interface FuenteSolicitudes {
  recibidas(filtro: {
    convocatoriaId?: string;
    estados?: readonly string[];
    desde?: Date;
    hasta?: Date;
  }): Promise<SolicitudReportable[]>;
}

export interface PerfilReportable {
  readonly usuarioId: string;
  readonly nivel: string | null;
  readonly departamento: string | null;
  readonly centroEducativo: string | null;
}

export interface FuentePerfiles {
  perfiles(usuarioIds: readonly string[]): Promise<PerfilReportable[]>;
  departamentos(): { codigo: string; nombre: string }[];
}

export interface ConvocatoriaReportable {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly tipo: string;
  readonly estado: string;
  readonly cupos: number;
}

export interface FuenteConvocatorias {
  todas(): Promise<ConvocatoriaReportable[]>;
}

/** Un formato de salida. Un formato nuevo es una clase nueva registrada en el módulo. */
export interface ExportadorReporte {
  readonly formato: 'CSV' | 'PDF';
  readonly tipoContenido: string;
  readonly extension: string;
  exportar(reporte: Reporte): Buffer;
}
