/**
 * Prueba unitaria — US-030: CSV y PDF.
 *
 * El PDF se valida por su estructura: cabecera, una entrada de la tabla xref por objeto, y que
 * cada desplazamiento apunte exactamente al inicio de su objeto. Un PDF con la tabla mal calculada
 * lo abre un navegador "reparándolo", pero no todos los lectores lo hacen.
 */
import { Reporte } from '../../domain/reporte';
import { CsvExportador, celda } from './csv.exportador';
import { aWinAnsi, generarPdf } from './pdf-simple';
import { PdfExportador } from './pdf.exportador';

function reporte(filas = 3): Reporte {
  return {
    titulo: 'Reporte de solicitudes',
    nombre: 'reporte-solicitudes',
    generadoEn: '2026-10-05T15:00:00.000Z',
    filtros: [{ etiqueta: 'Departamento', valor: 'Petén' }],
    columnas: [
      { clave: 'numero', titulo: 'Solicitud' },
      { clave: 'centro', titulo: 'Centro educativo' },
      { clave: 'dias', titulo: 'Días', numerica: true },
    ],
    filas: Array.from({ length: filas }, (_, i) => ({
      numero: `SOL-2026-${String(i + 1).padStart(6, '0')}`,
      centro: i === 0 ? '=HYPERLINK("http://x")' : 'Colegio "El Ñandú", Sololá',
      dias: i === 2 ? null : 10.5,
    })),
    agrupacion: 'Departamento',
    grupos: [{ clave: 'PETEN', etiqueta: 'Petén', total: filas }],
    total: filas,
  };
}

describe('CsvExportador', () => {
  const texto = () => new CsvExportador().exportar(reporte()).toString('utf8');

  it('empieza con BOM y los títulos; una línea por fila con CRLF', () => {
    const t = texto();
    expect(t.startsWith('\uFEFFSolicitud,Centro educativo,Días\r\n')).toBe(true);
    expect(t.split('\r\n')).toHaveLength(5);
  });

  it('comillas, comas y acentos según RFC 4180', () => {
    expect(texto()).toContain('SOL-2026-000002,"Colegio ""El Ñandú"", Sololá",10.5');
  });

  it('neutraliza fórmulas y deja vacío lo que no tiene dato', () => {
    expect(texto()).toContain(`SOL-2026-000001,"'=HYPERLINK(""http://x"")",10.5`);
    expect(texto()).toContain('SOL-2026-000003,"Colegio ""El Ñandú"", Sololá",\r\n');
  });

  it.each([
    ['+1', "'+1"],
    ['-2', "'-2"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\tx', "'\tx"],
    ['normal', 'normal'],
  ])('celda %j → %j', (entrada, esperado) => {
    expect(celda(entrada)).toBe(esperado);
  });

  it('los números no se tocan, aunque sean negativos', () => {
    expect(celda(-3)).toBe('-3');
  });
});

describe('PDF', () => {
  function validarEstructura(pdf: Buffer) {
    const t = pdf.toString('latin1');
    expect(t.startsWith('%PDF-1.4\n')).toBe(true);
    expect(t.trimEnd().endsWith('%%EOF')).toBe(true);

    const inicioXref = Number(/startxref\n(\d+)\n%%EOF/.exec(t)?.[1]);
    expect(t.slice(inicioXref, inicioXref + 4)).toBe('xref');

    const cantidad = Number(/xref\n0 (\d+)\n/.exec(t)?.[1]);
    const entradas = [...t.slice(inicioXref).matchAll(/(\d{10}) 00000 n /g)].map((m) =>
      Number(m[1]),
    );
    expect(entradas).toHaveLength(cantidad - 1);
    entradas.forEach((desplazamiento, i) => {
      expect(t.slice(desplazamiento, desplazamiento + `${i + 1} 0 obj`.length)).toBe(
        `${i + 1} 0 obj`,
      );
    });
    return t;
  }

  it('un PDF de dos páginas tiene la estructura correcta', () => {
    const pdf = generarPdf(
      [
        [{ x: 10, y: 10, texto: 'Hola (mundo) \\ á', tamano: 10 }],
        [{ x: 10, y: 10, texto: 'Página 2', tamano: 10, negrita: true }],
      ],
      { ancho: 842, alto: 595 },
    );
    const t = validarEstructura(pdf);
    expect(t).toContain('/Count 2');
    // Paréntesis y barra invertida escapados; la "á" en WinAnsi (0xE1).
    expect(t).toContain('(Hola \\(mundo\\) \\\\ \xE1) Tj');
  });

  it('WinAnsi: español sí, lo demás como "?"', () => {
    expect([...aWinAnsi('ñ€—…漢😀')]).toEqual([0xf1, 0x80, 0x97, 0x85, 0x3f, 0x3f]);
  });

  it('el reporte trae título, filtros, resumen y pagina con "Página n de N"', () => {
    const t = validarEstructura(new PdfExportador().exportar(reporte(80)));
    expect(t).toContain('(Reporte de solicitudes) Tj');
    expect(t).toContain('(Departamento: Pet\xE9n) Tj');
    expect(t).toContain('(Resumen por departamento) Tj');
    const paginas = Number(/\/Count (\d+)/.exec(t)?.[1]);
    expect(paginas).toBeGreaterThan(1);
    expect(t).toContain(`(P\xE1gina ${paginas} de ${paginas}) Tj`);
    // Los títulos de columna se repiten en cada página.
    expect(t.split('(Solicitud) Tj').length - 1).toBe(paginas);
  });

  it('sin filas lo dice', () => {
    const t = validarEstructura(new PdfExportador().exportar({ ...reporte(0), grupos: [] }));
    expect(t).toContain('(No hay datos con estos filtros.) Tj');
  });
});
