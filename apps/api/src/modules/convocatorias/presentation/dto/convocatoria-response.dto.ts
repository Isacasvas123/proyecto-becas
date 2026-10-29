/**
 * Contrato público de la API: lo que ve el frontend y no se puede cambiar sin avisar.
 *
 * Es un DTO aparte del de application/ porque responden a preguntas distintas: aquel es lo que
 * devuelve el caso de uso y este es lo que expone el endpoint. Hoy coinciden; si el público
 * necesita ver menos campos que un administrador, se separan sin tocar el caso de uso.
 *
 * Es una clase y no una interfaz porque los DTOs de entrada llevan decoradores de
 * `class-validator`, que necesitan una clase en tiempo de ejecución.
 */
export class ElementoCatalogoResponseDto {
  codigo!: string;
  descripcion!: string;
}

export class ConvocatoriaResponseDto {
  id!: string;
  codigo!: string;
  titulo!: string;
  descripcion!: string;
  tipo!: string;
  estado!: string;
  cupos!: number;

  /** PO, 17 Oct 2026: monto de la beca y si por eso necesita doble aprobacion. */
  montoBeca!: number;

  exigeSegundaAprobacion!: boolean;
  fechaApertura!: string;
  fechaCierre!: string;
  requisitos!: readonly ElementoCatalogoResponseDto[];
  documentosExigidos!: readonly ElementoCatalogoResponseDto[];
}
