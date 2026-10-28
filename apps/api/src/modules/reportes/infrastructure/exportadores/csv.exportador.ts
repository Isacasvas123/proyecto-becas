/**
 * US-030 — Exportar a CSV.
 *
 * - UTF-8 con BOM: sin él, Excel en Windows abre "Petén" como "PetÃ©n".
 * - Coma como separador y comillas dobles cuando hace falta (RFC 4180).
 * - INYECCIÓN DE FÓRMULAS: una celda que empieza con `=`, `+`, `-`, `@`, tabulador o retorno de
 *   carro se ejecuta como fórmula al abrir el archivo en una hoja de cálculo. Un centro educativo
 *   llamado `=HYPERLINK(...)` sería un ataque contra quien abra el reporte. Esas celdas se prefijan
 *   con un apóstrofo. Los números no pasan por aquí: se escriben tal cual.
 * - Solo el detalle: la agrupación, si la hay, va en el PDF y en la pantalla.
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
