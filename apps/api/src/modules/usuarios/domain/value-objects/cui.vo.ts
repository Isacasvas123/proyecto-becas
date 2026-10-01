/**
 * CAPA: domain/value-objects/
 * ────────────────────────────────────────────────────────────────────────────────
 * CUI — Código Único de Identificación del RENAP (US-001).
 *
 * Es el número que identifica a cada guatemalteco desde que se inscribe su nacimiento, y el
 * mismo que aparece en el DPI. Por eso sirve para que una persona no tenga dos cuentas: el
 * criterio de US-001 exige que sea **único en el sistema**.
 *
 * QUÉ SE VALIDA
 *   Exactamente lo que dice el criterio de aceptación: **13 dígitos**. Se aceptan los
 *   espacios y guiones con que suele escribirse (`2456 78901 0101`), porque así viene impreso
 *   en el DPI, y se normalizan antes de guardar: dos formas de escribir el mismo CUI tienen que
 *   chocar contra la misma restricción de unicidad.
 *
 * QUÉ NO SE VALIDA, A PROPÓSITO
 *   El CUI tiene estructura interna: un dígito verificador y los códigos de departamento y
 *   municipio. Comprobarlos detectaría errores de tipeo, pero ningún criterio lo pide, y una
 *   implementación incorrecta rechazaría CUI reales, que es peor que aceptar uno mal escrito.
 *   Queda como mejora a proponer al Product Owner, no como regla inventada por el equipo.
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
