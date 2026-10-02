/**
 * ADAPTADOR de almacenamiento en disco local, para desarrollo (US-013).
 *
 * SEGURIDAD
 *   La referencia que se guarda es una ruta RELATIVA a la carpeta raíz, y antes de leer o borrar se
 *   comprueba que, resuelta, siga dentro de esa carpeta. Así una referencia manipulada como
 *   `../../.env` no puede usarse para leer ni borrar nada fuera de `uploads/`.
 *
 * La carpeta está en `.gitignore`: los documentos de los aspirantes nunca llegan al repositorio.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { AlmacenamientoDocumentos } from '../../domain/ports/almacenamiento-documentos';

export class AlmacenamientoLocalAdapter implements AlmacenamientoDocumentos {
  private readonly raiz: string;

  constructor(carpeta: string) {
    this.raiz = resolve(carpeta);
  }

  async guardar(contenido: Buffer, destino: { carpeta: string; nombre: string }): Promise<string> {
    const referencia = join(destino.carpeta, destino.nombre).split(sep).join('/');
    const ruta = this.dentroDeLaRaiz(referencia);
    await mkdir(dirname(ruta), { recursive: true });
    await writeFile(ruta, contenido, { flag: 'wx' }); // 'wx': nunca sobrescribe en silencio
    return referencia;
  }

  async obtener(referencia: string): Promise<Buffer> {
    return readFile(this.dentroDeLaRaiz(referencia));
  }

  async eliminar(referencia: string): Promise<void> {
    await rm(this.dentroDeLaRaiz(referencia), { force: true });
  }

  private dentroDeLaRaiz(referencia: string): string {
    const ruta = resolve(this.raiz, referencia);
    const desdeRaiz = relative(this.raiz, ruta);
    if (desdeRaiz === '' || desdeRaiz.startsWith('..') || isAbsolute(desdeRaiz)) {
      throw new Error(`Referencia de almacenamiento fuera de la carpeta permitida: ${referencia}`);
    }
    return ruta;
  }
}
