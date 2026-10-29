/**
 * US-030 — Exportar a PDF. Página horizontal (las tablas de solicitudes tienen diez columnas),
 * encabezado con título, fecha y filtros, el resumen por grupo si lo hay, y el detalle con su fila
 * de títulos repetida en cada página. Pie con "Página n de N".
 */
import { Injectable } from '@nestjs/common';

import { fechaCorta } from '../../application/nombres';
import { ExportadorReporte } from '../../domain/ports/puertos';
import { Columna, Reporte, Valor } from '../../domain/reporte';
import { Texto, anchoAproximado, generarPdf } from './pdf-simple';

const PAGINA = { ancho: 842, alto: 595 };
const MARGEN = 36;
const ALTO_LINEA = 13;
const TAMANO = 8;
const SEPARACION = 8;

@Injectable()
export class PdfExportador implements ExportadorReporte {
  readonly formato = 'PDF' as const;
  readonly tipoContenido = 'application/pdf';
  readonly extension = 'pdf';

  exportar(reporte: Reporte): Buffer {
    const paginas: Texto[][] = [];
    let actual: Texto[] = [];
    let y = PAGINA.alto - MARGEN;

    const nuevaPagina = () => {
      paginas.push(actual);
      actual = [];
      y = PAGINA.alto - MARGEN;
    };
    const espacio = (lineas: number) => {
      if (y - lineas * ALTO_LINEA < MARGEN + ALTO_LINEA) nuevaPagina();
    };
    const escribir = (texto: string, opciones: Partial<Texto> = {}) => {
      // Un texto más grande necesita espacio arriba (la y es la línea base), no solo abajo.
      const tamano = opciones.tamano ?? TAMANO;
      y -= Math.max(0, tamano - TAMANO);
      espacio(1);
      actual.push({ x: MARGEN, y, texto, tamano, ...opciones });
      y -= ALTO_LINEA + Math.max(0, tamano - TAMANO) / 2;
    };

    // Encabezado
    escribir('Plataforma Nacional de Becas · Ministerio de Educación', { tamano: 8 });
    escribir(reporte.titulo, { tamano: 16, negrita: true });
    escribir(`Generado: ${fechaCorta(new Date(reporte.generadoEn))} · Total: ${reporte.total}`);
    for (const f of reporte.filtros) escribir(`${f.etiqueta}: ${f.valor}`);
    y -= ALTO_LINEA / 2;

    // Resumen por grupo
    if (reporte.grupos !== null && reporte.grupos.length > 0) {
      escribir(`Resumen por ${reporte.agrupacion?.toLowerCase() ?? 'grupo'}`, {
        tamano: 11,
        negrita: true,
      });
      for (const g of reporte.grupos) {
        espacio(1);
        actual.push({ x: MARGEN, y, texto: recortar(g.etiqueta, 220), tamano: TAMANO });
        actual.push({ x: MARGEN + 260, y, texto: String(g.total), tamano: TAMANO, derecha: true });
        y -= ALTO_LINEA;
      }
      y -= ALTO_LINEA / 2;
    }

    // Detalle
    if (reporte.filas.length === 0) {
      escribir('No hay datos con estos filtros.');
    } else {
      const anchos = calcularAnchos(reporte);
      const titulos = () => {
        espacio(2);
        let x = MARGEN;
        reporte.columnas.forEach((c, i) => {
          actual.push(celda(c, c.titulo, x, anchos[i], y, true));
          x += anchos[i] + SEPARACION;
        });
        y -= ALTO_LINEA + 2;
      };
      titulos();
      for (const fila of reporte.filas) {
        if (y - ALTO_LINEA < MARGEN + ALTO_LINEA) {
          nuevaPagina();
          titulos();
        }
        let x = MARGEN;
        reporte.columnas.forEach((c, i) => {
          actual.push(celda(c, texto(fila[c.clave]), x, anchos[i], y, false));
          x += anchos[i] + SEPARACION;
        });
        y -= ALTO_LINEA;
      }
    }

    paginas.push(actual);
    const total = paginas.length;
    paginas.forEach((p, i) =>
      p.push({
        x: PAGINA.ancho - MARGEN,
        y: MARGEN / 2,
        texto: `Página ${i + 1} de ${total}`,
        tamano: 7,
        derecha: true,
      }),
    );
    return generarPdf(paginas, PAGINA);
  }
}

function texto(v: Valor | undefined): string {
  return v === null || v === undefined ? '—' : String(v);
}

function celda(
  c: Columna,
  valor: string,
  x: number,
  ancho: number,
  y: number,
  negrita: boolean,
): Texto {
  const recortado = recortar(valor, ancho, negrita);
  return c.numerica
    ? { x: x + ancho, y, texto: recortado, tamano: TAMANO, negrita, derecha: true }
    : { x, y, texto: recortado, tamano: TAMANO, negrita };
}

/** Reparte el ancho útil en proporción al texto más largo de cada columna (con mínimo y máximo). */
function calcularAnchos(reporte: Reporte): number[] {
  const util = PAGINA.ancho - 2 * MARGEN - SEPARACION * (reporte.columnas.length - 1);
  const deseados = reporte.columnas.map((c) => {
    const largo = Math.max(
      anchoAproximado(c.titulo, TAMANO, true),
      ...reporte.filas.slice(0, 200).map((f) => anchoAproximado(texto(f[c.clave]), TAMANO)),
    );
    return Math.min(Math.max(largo, 40), 220);
  });
  const suma = deseados.reduce((a, b) => a + b, 0);
  const factor = suma > util ? util / suma : 1;
  return deseados.map((d) => d * factor);
}

function recortar(valor: string, ancho: number, negrita = false): string {
  if (anchoAproximado(valor, TAMANO, negrita) <= ancho) return valor;
  let corto = valor;
  while (corto.length > 1 && anchoAproximado(`${corto}…`, TAMANO, negrita) > ancho) {
    corto = corto.slice(0, -1);
  }
  return `${corto}…`;
}
