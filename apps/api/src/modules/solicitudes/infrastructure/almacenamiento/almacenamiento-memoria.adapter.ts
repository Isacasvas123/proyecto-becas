import { AlmacenamientoDocumentos } from '../../domain/ports/almacenamiento-documentos';

/** Doble para pruebas: mismo contrato que el adaptador de disco, sin tocar el disco. */
export class AlmacenamientoMemoriaAdapter implements AlmacenamientoDocumentos {
  readonly archivos = new Map<string, Buffer>();

  guardar(contenido: Buffer, destino: { carpeta: string; nombre: string }): Promise<string> {
    const referencia = `${destino.carpeta}/${destino.nombre}`;
    this.archivos.set(referencia, Buffer.from(contenido));
    return Promise.resolve(referencia);
  }

  obtener(referencia: string): Promise<Buffer> {
    const archivo = this.archivos.get(referencia);
    return archivo === undefined
      ? Promise.reject(new Error(`No existe ${referencia}`))
      : Promise.resolve(archivo);
  }

  eliminar(referencia: string): Promise<void> {
    this.archivos.delete(referencia);
    return Promise.resolve();
  }
}
