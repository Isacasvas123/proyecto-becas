/**
 * PUERTO del almacenamiento de archivos (US-013) · patrón Adapter.
 *
 * El dominio no sabe si los archivos van a un disco, a la nube o a memoria. Solo necesita tres
 * operaciones y una referencia opaca que guardar junto al documento. En desarrollo lo implementa
 * `AlmacenamientoLocalAdapter`; en producción irá uno de nube, sin tocar una línea de este módulo.
 */
export const ALMACENAMIENTO_DOCUMENTOS = Symbol('AlmacenamientoDocumentos');

export interface AlmacenamientoDocumentos {
  /** Guarda el contenido y devuelve la referencia con la que se recupera. */
  guardar(contenido: Buffer, destino: { carpeta: string; nombre: string }): Promise<string>;
  obtener(referencia: string): Promise<Buffer>;
  eliminar(referencia: string): Promise<void>;
}
