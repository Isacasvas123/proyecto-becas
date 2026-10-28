/**
 * Un reporte ya generado, independiente del formato. Los exportadores (CSV, PDF) solo saben leer
 * esta forma: un reporte nuevo no necesita un exportador nuevo, y un formato nuevo sirve para todos
 * los reportes.
 */
export type Valor = string | number | null;

export interface Columna {
  readonly clave: string;
  readonly titulo: string;
  /** Para alinear a la derecha en el PDF. */
  readonly numerica?: boolean;
}

export interface Grupo {
  readonly clave: string;
  readonly etiqueta: string;
  readonly total: number;
}

export interface Reporte {
  readonly titulo: string;
  /** Para el nombre del archivo: `reporte-solicitudes`. */
  readonly nombre: string;
  readonly generadoEn: string;
  /** Los filtros aplicados, en palabras. */
  readonly filtros: readonly { readonly etiqueta: string; readonly valor: string }[];
  readonly columnas: readonly Columna[];
  readonly filas: readonly Readonly<Record<string, Valor>>[];
  readonly agrupacion: string | null;
  readonly grupos: readonly Grupo[] | null;
  readonly total: number;
}
