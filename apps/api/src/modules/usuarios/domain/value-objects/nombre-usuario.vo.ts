/**
 * CAPA: domain/value-objects/
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ ES UN OBJETO DE VALOR
 *   Un dato sin identidad propia, definido por su contenido, que se valida al construirse
 *   y después es inmutable. Una vez que tienes un `NombreUsuario`, sabes con certeza que
 *   es válido: no hay forma de crear uno que no lo sea.
 *
 * POR QUÉ NO USAR UN `string` SUELTO
 *   Un `string` puede venir vacío, con espacios o con mayúsculas inconsistentes, y cada
 *   punto del código tendría que acordarse de validarlo y normalizarlo. Al encapsularlo,
 *   la regla vive en UN solo lugar y el compilador impide confundir un nombre de usuario
 *   con cualquier otro texto.
 *
 * NORMALIZACIÓN
 *   Se guarda siempre en minúsculas y sin espacios extremos, para que "Admin", "ADMIN" y
 *   " admin " sean el mismo usuario al iniciar sesión.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

const LONGITUD_MINIMA = 3;
const LONGITUD_MAXIMA = 30;
/** Letras, dígitos, punto, guion y guion bajo. Sin espacios ni acentos. */
const FORMATO_PERMITIDO = /^[a-z0-9._-]+$/;

export class NombreUsuario {
  private constructor(readonly valor: string) {}

  /**
   * Única vía de construcción. Normaliza primero y valida después, para que las reglas se
   * apliquen sobre el valor que realmente se va a almacenar.
   */
  static crear(entrada: string): NombreUsuario {
    const normalizado = entrada.trim().toLowerCase();

    if (normalizado.length < LONGITUD_MINIMA || normalizado.length > LONGITUD_MAXIMA) {
      throw new ReglaDeNegocioError(
        `El nombre de usuario debe tener entre ${LONGITUD_MINIMA} y ${LONGITUD_MAXIMA} caracteres`,
      );
    }

    if (!FORMATO_PERMITIDO.test(normalizado)) {
      throw new ReglaDeNegocioError(
        'El nombre de usuario solo admite letras, dígitos, punto, guion y guion bajo',
      );
    }

    return new NombreUsuario(normalizado);
  }

  /** Dos objetos de valor son iguales si su contenido lo es (no por referencia). */
  equals(otro: NombreUsuario): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
