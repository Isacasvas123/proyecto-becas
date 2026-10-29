/**
 * Forma plana de lo que devuelve el caso de uso, sin comportamiento.
 *
 * No se devuelve la entidad porque tiene métodos y estado privado: serializarla expondría
 * detalles internos y ataría el contrato de la API a la forma del dominio. Este DTO es el
 * punto de separación entre ambos. Es código de traducción, trade-off aceptado en
 * docs/05-arquitectura.md §2.2 a cambio de la independencia del dominio.
 */
/**
 * Un elemento de catálogo tal como lo necesita quien lo muestra: el código estable, para
 * guardarlo y compararlo, y la descripción legible, para enseñarlo.
 */
export interface ElementoCatalogoDto {
  readonly codigo: string;
  readonly descripcion: string;
}

export interface ConvocatoriaListadaDto {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly tipo: string;
  readonly estado: string;
  readonly cupos: number;
  /** PO, 17 Oct 2026. */
  readonly montoBeca: number;
  readonly exigeSegundaAprobacion: boolean;
  readonly fechaApertura: string;
  readonly fechaCierre: string;
  /** US-008: el visitante ve los requisitos antes de decidir si postula. */
  readonly requisitos: readonly ElementoCatalogoDto[];
  readonly documentosExigidos: readonly ElementoCatalogoDto[];
}
