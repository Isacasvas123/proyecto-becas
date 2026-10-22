/**
 * PUERTOS hacia OTROS módulos.
 *
 * `solicitudes` necesita saber dos cosas que no le pertenecen: si una convocatoria admite
 * postulaciones y si el perfil del estudiante está completo. En vez de importar las entidades de
 * `convocatorias` y `estudiantes` —que ataría este dominio a los suyos—, declara aquí lo que
 * necesita, con sus propias palabras. Los adaptadores de `infrastructure/integraciones/` lo
 * resuelven llamando a los servicios que esos módulos exportan.
 *
 * Es la inversión de dependencias aplicada ENTRE módulos, no solo hacia la base de datos.
 */
export const CONSULTA_CONVOCATORIAS = Symbol('ConsultaConvocatorias');
export const CONSULTA_PERFILES = Symbol('ConsultaPerfiles');

export interface ConvocatoriaDeSolicitud {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly admiteSolicitudes: boolean;
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
