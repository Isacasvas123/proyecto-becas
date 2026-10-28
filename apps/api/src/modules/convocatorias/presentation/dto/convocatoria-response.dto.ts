/**
 * CAPA: presentation/dto/
 *
 * El CONTRATO PÚBLICO de la API. Lo que ve el frontend, lo que se documenta y lo que no
 * se puede cambiar sin avisar a quien consume la API.
 *
 * ¿Por qué otro DTO si `ConvocatoriaListadaDto` de application/ ya tiene estos campos?
 * Porque responden a preguntas distintas: el de application/ es "qué devuelve el caso de
 * uso" y este es "qué expone el endpoint". Hoy coinciden; en cuanto una historia futura
 * necesite exponer menos campos al público que a un administrador —y US-008 apunta
 * justo ahí—, se separan sin tocar el caso de uso.
 *
 * Es una clase y no una interfaz porque en el Sprint 3 los DTOs de ENTRADA llevarán
 * decoradores de `class-validator` (`@IsString()`, `@IsInt()`, `@Min(1)`), y los
 * decoradores necesitan una clase que exista en tiempo de ejecución.
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
