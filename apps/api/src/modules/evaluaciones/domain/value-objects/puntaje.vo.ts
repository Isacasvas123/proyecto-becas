/**
 * Puntaje de 0 a 100 con dos decimales (US-019). Se redondea al crearlo para que dos cálculos
 * iguales den el mismo valor guardado: un ranking que pone 79.999999 sobre 80 no se explica en una
 * auditoría.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export class Puntaje {
  private constructor(readonly valor: number) {}

  static de(valor: number): Puntaje {
    if (!Number.isFinite(valor)) {
      throw new ReglaDeNegocioError('El puntaje debe ser un número.');
    }
    // Recorte en los extremos: una fórmula puede pasarse por redondeo, no por diseño.
    const acotado = Math.min(100, Math.max(0, valor));
    return new Puntaje(Math.round(acotado * 100) / 100);
  }

  /** Promedio de varios puntajes; `null` si no hay ninguno. */
  static promedio(puntajes: readonly Puntaje[]): Puntaje | null {
    if (puntajes.length === 0) return null;
    return Puntaje.de(puntajes.reduce((suma, p) => suma + p.valor, 0) / puntajes.length);
  }
}
