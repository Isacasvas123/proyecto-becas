/**
 * Errores del DOMINIO.
 *
 * TypeScript puro, a propósito: el dominio los lanza y por tanto no puede depender de
 * `HttpException` de NestJS. La traducción de error de dominio a código HTTP ocurre en la
 * frontera con el mundo exterior (ver `dominio-exception.filter.ts`), que sí es
 * infraestructura de presentación.
 *
 * Este archivo vive en `shared/` porque los seis módulos de negocio lo comparten.
 */

/** Base común: permite un único filtro de excepciones para todo el dominio. */
export abstract class ErrorDeDominio extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Se violó una regla de negocio (cupos inválidos, fechas incoherentes, etc.). */
export class ReglaDeNegocioError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** Se intentó una transición de estado no permitida por el ciclo de vida de la entidad. */
export class TransicionInvalidaError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
