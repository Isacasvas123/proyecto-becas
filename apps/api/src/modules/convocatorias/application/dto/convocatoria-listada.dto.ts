/**
 * CAPA: application/dto/
 *
 * QUÉ VA AQUÍ: la forma de los datos que el caso de uso DEVUELVE, expresada como un
 * objeto plano, sin comportamiento.
 *
 * POR QUÉ NO DEVOLVER LA ENTIDAD `Convocatoria` DIRECTAMENTE:
 *   1. La entidad tiene métodos y estado privado; serializarla a JSON expondría detalles
 *      internos y ataría el contrato de la API a la forma interna del dominio.
 *   2. Si mañana la entidad se reorganiza, el contrato público de la API no debería
 *      romperse. Este DTO es justamente la junta de dilatación entre ambos.
 *
 * Sí, es código de traducción. docs/05-arquitectura.md §2.2 lo declara como trade-off
 * aceptado a cambio de la independencia del dominio.
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
