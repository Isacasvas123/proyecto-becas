/**
 * PUERTOS hacia otros módulos. Mismo criterio que en `solicitudes`: se declara aquí lo que se
 * necesita, con palabras de este módulo, y los adaptadores de `infrastructure/integraciones/` lo
 * resuelven con los servicios que `solicitudes`, `convocatorias`, `estudiantes` y `usuarios`
 * exportan.
 */
import { DatosEvaluables } from '../strategies/criterio-evaluacion.strategy';

export const CONSULTA_SOLICITUDES = Symbol('ConsultaSolicitudes');
export const CONSULTA_CONVOCATORIAS_EVALUACION = Symbol('ConsultaConvocatoriasEvaluacion');
export const CONSULTA_PERFILES_EVALUACION = Symbol('ConsultaPerfilesEvaluacion');
export const CONSULTA_CUENTAS = Symbol('ConsultaCuentas');

export interface SolicitudResumida {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly enviadaEn: string | null;
}

export interface DocumentoVisible {
  readonly tipo: string;
  readonly descripcion: string;
  readonly cargado: boolean;
  readonly nombreArchivo: string | null;
  readonly tamanoBytes: number | null;
}

export interface ExpedienteVisible {
  readonly resumen: SolicitudResumida;
  readonly documentos: readonly DocumentoVisible[];
  readonly convocatoriaTitulo: string;
}

export interface ArchivoVisible {
  readonly contenido: Buffer;
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
}

export interface ConsultaSolicitudes {
  enviadasDe(convocatoriaId: string): Promise<SolicitudResumida[]>;
  /** Las que ya estan EN_EVALUACION: algunas pueden haber quedado sin evaluador (CU-13, 5a). */
  enEvaluacionDe(convocatoriaId: string): Promise<SolicitudResumida[]>;
  resumenes(ids: readonly string[]): Promise<SolicitudResumida[]>;
  iniciarEvaluacion(ids: readonly string[], convocatoriaId: string, autorId: string): Promise<void>;
  expediente(id: string): Promise<ExpedienteVisible | null>;
  documento(id: string, tipo: string): Promise<ArchivoVisible | null>;
}

export interface ConvocatoriaEvaluable {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly tipo: string;
  readonly cupos: number;
}

export interface ConsultaConvocatoriasEvaluacion {
  buscar(id: string): Promise<ConvocatoriaEvaluable | null>;
}

export interface PerfilEvaluable extends DatosEvaluables {
  readonly centroEducativo: string | null;
  readonly nivel: string | null;
  readonly departamento: string | null;
  readonly municipio: string | null;
}

export interface ConsultaPerfilesEvaluacion {
  perfil(estudianteId: string): Promise<PerfilEvaluable>;
}

export interface Persona {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly nombreUsuario: string;
  readonly rol: string;
  readonly activo: boolean;
}

export interface ConsultaCuentas {
  evaluadores(): Promise<Persona[]>;
  personas(ids: readonly string[]): Promise<Persona[]>;
}
