/**
 * US-030: exportar a CSV.
 *
 * - UTF-8 con BOM: sin él, Excel en Windows abre "Petén" como "PetÃ©n".
 * - Coma como separador y comillas dobles cuando hace falta (RFC 4180).
 * - Una celda que empieza con `=`, `+`, `-`, `@`, tabulador o retorno se ejecuta como fórmula al
 *   abrirla en una hoja de cálculo. Esas celdas se prefijan con un apóstrofo; los números no.
 * - Solo el detalle: la agrupación va en el PDF y en la pantalla.
 */
import { Injectable } from '@nestjs/common';

import { ExportadorReporte } from '../../domain/ports/puertos';
import { Reporte, Valor } from '../../domain/reporte';

const BOM = '\uFEFF';
const INICIO_PELIGROSO = /^[=+\-@\t\r]/;

@Injectable()
export class CsvExportador implements ExportadorReporte {
  readonly formato = 'CSV' as const;
  readonly tipoContenido = 'text/csv; charset=utf-8';
  readonly extension = 'csv';

  exportar(reporte: Reporte): Buffer {
    const lineas = [
      reporte.columnas.map((c) => celda(c.titulo)).join(','),
      ...reporte.filas.map((fila) => reporte.columnas.map((c) => celda(fila[c.clave])).join(',')),
    ];
    return Buffer.from(BOM + lineas.join('\r\n') + '\r\n', 'utf8');
  }
}

export function celda(valor: Valor | undefined): string {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number') return String(valor);
  const seguro = INICIO_PELIGROSO.test(valor) ? `'${valor}` : valor;
  return /[",\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}
