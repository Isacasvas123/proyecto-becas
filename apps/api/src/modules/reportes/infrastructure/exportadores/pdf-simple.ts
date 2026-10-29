/**
 * Escritor de PDF mínimo: páginas con texto en Helvetica.
 *
 * No usa biblioteca porque un reporte de gestión es texto en columnas: bastan unas 100 líneas
 * sobre PDF 1.4 y se evita una dependencia que habría que mantener y auditar. Si hicieran falta
 * gráficos, se cambia este archivo y el exportador no se entera.
 *
 * Las fuentes estándar usan WinAnsiEncoding: cubren el español, no todo Unicode. Lo que no está
 * se reemplaza por "?".
 */

export interface Texto {
  readonly x: number;
  readonly y: number;
  readonly texto: string;
  readonly tamano: number;
  readonly negrita?: boolean;
  /** Alinear a la derecha terminando en x. */
  readonly derecha?: boolean;
}

export interface TamanoPagina {
  readonly ancho: number;
  readonly alto: number;
}

/** Caracteres de WinAnsi fuera de Latin-1. */
const WIN_ANSI_EXTRA: Readonly<Record<string, number>> = {
  '€': 0x80,
  '…': 0x85,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
};

export function aWinAnsi(texto: string): Buffer {
  const bytes: number[] = [];
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 0x3f;
    if (WIN_ANSI_EXTRA[caracter] !== undefined) bytes.push(WIN_ANSI_EXTRA[caracter]);
    else if (codigo >= 0x20 && codigo <= 0xff && (codigo < 0x7f || codigo >= 0xa0))
      bytes.push(codigo);
    else bytes.push(0x3f);
  }
  return Buffer.from(bytes);
}

/** Ancho aproximado de un texto en Helvetica: suficiente para recortar y alinear. */
export function anchoAproximado(texto: string, tamano: number, negrita = false): number {
  let unidades = 0;
  for (const c of texto) {
    if ("ijlI.,;:'!|".includes(c)) unidades += 0.28;
    else if ('mwMW@'.includes(c)) unidades += 0.85;
    else if (c === ' ') unidades += 0.28;
    else if (c >= 'A' && c <= 'Z') unidades += 0.67;
    else unidades += 0.55;
  }
  return unidades * tamano * (negrita ? 1.05 : 1);
}

function escaparCadena(bytes: Buffer): Buffer {
  const salida: number[] = [];
  for (const b of bytes) {
    if (b === 0x28 || b === 0x29 || b === 0x5c) salida.push(0x5c);
    salida.push(b);
  }
  return Buffer.from(salida);
}

function contenidoDePagina(textos: readonly Texto[]): Buffer {
  const partes: Buffer[] = [];
  for (const t of textos) {
    const bytes = aWinAnsi(t.texto);
    const x = t.derecha ? t.x - anchoAproximado(t.texto, t.tamano, t.negrita) : t.x;
    partes.push(
      Buffer.from(
        `BT /${t.negrita ? 'F2' : 'F1'} ${t.tamano} Tf ${x.toFixed(2)} ${t.y.toFixed(2)} Td (`,
        'latin1',
      ),
      escaparCadena(bytes),
      Buffer.from(') Tj ET\n', 'latin1'),
    );
  }
  return Buffer.concat(partes);
}

export function generarPdf(paginas: readonly (readonly Texto[])[], tamano: TamanoPagina): Buffer {
  // Objetos: 1 catálogo, 2 páginas, 3 y 4 fuentes, luego (página, contenido) por cada página.
  const objetos: Buffer[] = [];
  const idsPagina = paginas.map((_, i) => 5 + i * 2);

  objetos.push(Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1'));
  objetos.push(
    Buffer.from(
      `<< /Type /Pages /Kids [${idsPagina.map((id) => `${id} 0 R`).join(' ')}] /Count ${paginas.length} >>`,
      'latin1',
    ),
  );
  objetos.push(
    Buffer.from(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      'latin1',
    ),
  );
  objetos.push(
    Buffer.from(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      'latin1',
    ),
  );

  paginas.forEach((textos, i) => {
    const contenido = contenidoDePagina(textos);
    objetos.push(
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${tamano.ancho} ${tamano.alto}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idsPagina[i] + 1} 0 R >>`,
        'latin1',
      ),
    );
    objetos.push(
      Buffer.concat([
        Buffer.from(`<< /Length ${contenido.length} >>\nstream\n`, 'latin1'),
        contenido,
        Buffer.from('\nendstream', 'latin1'),
      ]),
    );
  });

  const partes: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  let posicion = partes[0].length;
  const desplazamientos: number[] = [];
  objetos.forEach((cuerpo, i) => {
    desplazamientos.push(posicion);
    const bloque = Buffer.concat([
      Buffer.from(`${i + 1} 0 obj\n`, 'latin1'),
      cuerpo,
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    partes.push(bloque);
    posicion += bloque.length;
  });

  const xref =
    `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n` +
    desplazamientos.map((d) => `${String(d).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${posicion}\n%%EOF\n`;
  partes.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(partes);
}
