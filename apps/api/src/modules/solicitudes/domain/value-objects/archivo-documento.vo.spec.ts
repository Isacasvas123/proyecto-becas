import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { ArchivoDocumento, TAMANO_MAXIMO_BYTES } from './archivo-documento.vo';

const FIRMA_PDF = Buffer.from('%PDF-1.4\n');
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const FIRMA_JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

function crear(tipoContenido: string, contenido: Buffer, nombreOriginal = 'archivo') {
  return ArchivoDocumento.crear({ nombreOriginal, tipoContenido, contenido });
}

describe('ArchivoDocumento (US-013)', () => {
  it.each([
    ['application/pdf', FIRMA_PDF, 'pdf'],
    ['image/png', FIRMA_PNG, 'png'],
    ['image/jpeg', FIRMA_JPG, 'jpg'],
  ])('acepta %s con su firma real (criterio 1)', (tipo, contenido, extension) => {
    const archivo = crear(tipo, contenido);

    expect(archivo.extension).toBe(extension);
    expect(archivo.tamanoBytes).toBe(contenido.length);
  });

  it('rechaza un formato fuera de la lista, con mensaje específico (criterio 2)', () => {
    expect(() => crear('application/msword', FIRMA_PDF)).toThrow(
      'Formato no permitido. Solo se aceptan archivos PDF, JPG o PNG.',
    );
  });

  it('rechaza un archivo que dice ser PDF y no lo es', () => {
    const ejecutable = Buffer.from('MZ\x90\x00 esto no es un pdf');

    expect(() => crear('application/pdf', ejecutable, 'constancia.pdf')).toThrow(
      /dice ser PDF pero su contenido no lo es/,
    );
  });

  it('rechaza un PNG disfrazado de JPG', () => {
    expect(() => crear('image/jpeg', FIRMA_PNG)).toThrow(ReglaDeNegocioError);
  });

  it('acepta exactamente 5 MB', () => {
    const contenido = Buffer.alloc(TAMANO_MAXIMO_BYTES);
    FIRMA_PDF.copy(contenido);

    expect(crear('application/pdf', contenido).tamanoBytes).toBe(TAMANO_MAXIMO_BYTES);
  });

  it('rechaza un byte más de 5 MB, diciendo cuánto pesa (criterio 2)', () => {
    const contenido = Buffer.alloc(TAMANO_MAXIMO_BYTES + 1);
    FIRMA_PDF.copy(contenido);

    expect(() => crear('application/pdf', contenido)).toThrow(
      'El archivo pesa 5.0 MB y el máximo permitido es 5 MB.',
    );
  });

  it('rechaza un archivo vacío', () => {
    expect(() => crear('application/pdf', Buffer.alloc(0))).toThrow('El archivo está vacío.');
  });

  describe('nombre para mostrar', () => {
    it('quita las rutas', () => {
      expect(crear('application/pdf', FIRMA_PDF, '../../etc/passwd').nombreOriginal).toBe('passwd');
      expect(crear('application/pdf', FIRMA_PDF, 'C:\\Users\\ana\\dpi.pdf').nombreOriginal).toBe(
        'dpi.pdf',
      );
    });

    it('quita caracteres de control y conserva espacios y guiones', () => {
      expect(crear('application/pdf', FIRMA_PDF, 'mi dpi-frente\r\n.pdf').nombreOriginal).toBe(
        'mi dpi-frente.pdf',
      );
    });

    it('usa un nombre por defecto si no queda nada', () => {
      expect(crear('image/png', FIRMA_PNG, '   ').nombreOriginal).toBe('documento.png');
    });

    it('recorta nombres muy largos', () => {
      expect(crear('application/pdf', FIRMA_PDF, 'a'.repeat(500)).nombreOriginal).toHaveLength(120);
    });
  });
});
