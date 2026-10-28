/**
 * Archivo que un estudiante sube como documento de respaldo (US-013).
 *
 * Criterios 1 y 2: PDF, JPG o PNG hasta 5 MB, y un archivo inválido se rechaza con un mensaje
 * específico.
 *
 * El formato se comprueba por el contenido y no por el nombre: el tipo que declara el navegador y
 * la extensión los controla quien sube el archivo, y un ejecutable renombrado a `constancia.pdf`
 * pasaría. Se leen los primeros bytes, la firma de cada formato, y se exige que coincidan.
 *
 * Los 5 MB son una constante y no una variable de entorno porque son un criterio de aceptación:
 * cambiarlos es cambiar la historia, y eso pasa por el Product Owner.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface Formato {
  readonly nombre: string;
  readonly extension: string;
  readonly firma: readonly number[];
}

/** Firmas de archivo ("magic numbers") de los tres formatos permitidos. */
const FORMATOS: Readonly<Record<string, Formato>> = {
  'application/pdf': { nombre: 'PDF', extension: 'pdf', firma: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'image/png': {
    nombre: 'PNG',
    extension: 'png',
    firma: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  'image/jpeg': { nombre: 'JPG', extension: 'jpg', firma: [0xff, 0xd8, 0xff] },
};

export interface DatosArchivo {
  readonly nombreOriginal: string;
  readonly tipoContenido: string;
  readonly contenido: Buffer;
}

export class ArchivoDocumento {
  private constructor(
    readonly nombreOriginal: string,
    readonly tipoContenido: string,
    readonly extension: string,
    readonly contenido: Buffer,
  ) {}

  get tamanoBytes(): number {
    return this.contenido.length;
  }

  static crear(datos: DatosArchivo): ArchivoDocumento {
    if (datos.contenido.length === 0) {
      throw new ReglaDeNegocioError('El archivo está vacío.');
    }

    if (datos.contenido.length > TAMANO_MAXIMO_BYTES) {
      const megas = (datos.contenido.length / 1024 / 1024).toFixed(1);
      throw new ReglaDeNegocioError(`El archivo pesa ${megas} MB y el máximo permitido es 5 MB.`);
    }

    const formato = FORMATOS[datos.tipoContenido];
    if (formato === undefined) {
      throw new ReglaDeNegocioError(
        'Formato no permitido. Solo se aceptan archivos PDF, JPG o PNG.',
      );
    }

    const coincide = formato.firma.every((byte, i) => datos.contenido[i] === byte);
    if (!coincide) {
      throw new ReglaDeNegocioError(
        `El archivo dice ser ${formato.nombre} pero su contenido no lo es. ` +
          'Vuelva a generarlo o escanearlo en ese formato.',
      );
    }

    return new ArchivoDocumento(
      ArchivoDocumento.limpiarNombre(datos.nombreOriginal, formato.extension),
      datos.tipoContenido,
      formato.extension,
      datos.contenido,
    );
  }

  /**
   * El nombre original solo se guarda para mostrarlo. Se le quitan rutas y caracteres de control:
   * un nombre como `../../etc/passwd` o con saltos de línea no debe llegar a ningún lado.
   */
  private static limpiarNombre(nombre: string, extension: string): string {
    const base = nombre.split(/[\\/]/).pop() ?? '';
    const limpio = [...base]
      .filter((c) => !esCaracterDeControl(c))
      .join('')
      .trim()
      .slice(0, 120);
    return limpio === '' ? `documento.${extension}` : limpio;
  }
}

/** De U+0000 a U+001F y U+007F: saltos de línea, tabuladores, NUL... */
function esCaracterDeControl(caracter: string): boolean {
  const codigo = caracter.codePointAt(0) ?? 0;
  return codigo < 0x20 || codigo === 0x7f;
}
