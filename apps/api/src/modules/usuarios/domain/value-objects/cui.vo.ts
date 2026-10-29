/**
 * CUI, Código Único de Identificación del RENAP (US-001): el mismo número del DPI. Sirve para que
 * una persona no tenga dos cuentas, porque el criterio exige que sea único en el sistema.
 *
 * Se valida lo que dice el criterio: 13 dígitos. Se aceptan los espacios y guiones con que viene
 * impreso (`2456 78901 0101`) y se normalizan, para que dos formas del mismo CUI choquen contra
 * la misma restricción de unicidad.
 *
 * No se valida el dígito verificador ni los códigos de departamento y municipio: ningún criterio
 * lo pide y una implementación incorrecta rechazaría CUI reales. Queda como mejora a proponer al
 * Product Owner.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

const TRECE_DIGITOS = /^\d{13}$/;

export class Cui {
  private constructor(readonly valor: string) {
    Object.freeze(this);
  }

  static crear(entrada: string): Cui {
    const normalizado = entrada.replace(/[\s-]/g, '');

    if (!TRECE_DIGITOS.test(normalizado)) {
      throw new ReglaDeNegocioError('El CUI debe tener exactamente 13 dígitos.');
    }

    return new Cui(normalizado);
  }

  equals(otro: Cui): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
