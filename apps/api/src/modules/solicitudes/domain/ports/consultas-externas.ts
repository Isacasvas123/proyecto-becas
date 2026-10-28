/**
 * Puertos hacia otros módulos.
 *
 * `solicitudes` necesita saber si una convocatoria admite postulaciones y si el perfil está
 * completo. En vez de importar las entidades de `convocatorias` y `estudiantes`, declara aquí lo
 * que necesita con sus palabras, y los adaptadores de `infrastructure/integraciones/` lo resuelven
 * con los servicios que esos módulos exportan. Es inversión de dependencias entre módulos.
 */
export const CONSULTA_CONVOCATORIAS = Symbol('ConsultaConvocatorias');
export const CONSULTA_PERFILES = Symbol('ConsultaPerfiles');

export interface ConvocatoriaDeSolicitud {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly admiteSolicitudes: boolean;
  readonly fechaApertura: Date;
  readonly fechaCierre: Date;
  /** Monto de la beca, en quetzales (PO, 17 Oct 2026). Decide si hara falta segunda aprobacion. */
  readonly montoBeca: number;
  readonly documentosExigidos: readonly { codigo: string; descripcion: string }[];
}

export interface ConsultaConvocatorias {
  buscar(convocatoriaId: string): Promise<ConvocatoriaDeSolicitud | null>;
}

export interface EstadoDePerfil {
  readonly completo: boolean;
  readonly camposFaltantes: readonly string[];
}

export interface ConsultaPerfiles {
  estado(estudianteId: string): Promise<EstadoDePerfil>;
}
