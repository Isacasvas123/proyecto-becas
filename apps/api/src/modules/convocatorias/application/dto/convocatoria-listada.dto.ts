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
export interface ConvocatoriaListadaDto {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly tipo: string;
  readonly estado: string;
  readonly cupos: number;
  readonly fechaApertura: string;
  readonly fechaCierre: string;
}
