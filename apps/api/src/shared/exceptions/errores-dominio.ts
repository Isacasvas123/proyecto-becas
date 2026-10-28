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

/**
 * Se pidió operar sobre algo que no existe (una convocatoria con un id desconocido).
 *
 * Es un error de DOMINIO y no un `NotFoundException` de NestJS para que el caso de uso lo
 * pueda lanzar sin depender del framework. El filtro lo traduce a HTTP 404.
 */
export class RecursoNoEncontradoError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/**
 * Alguien autenticado intenta operar sobre algo que no es suyo: la solicitud de otro estudiante.
 *
 * US-003, criterio textual: *"Un acceso no autorizado devuelve HTTP 403, no 404 ni el recurso."*
 * El filtro lo traduce a 403.
 */
export class AccesoDenegadoError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/**
 * Ya existe algo que debía ser único: un correo, un CUI o un nombre de usuario (US-001).
 * El filtro lo traduce a HTTP 409.
 */
export class RecursoDuplicadoError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/**
 * Las credenciales no son válidas o la cuenta no puede iniciar sesión (US-002).
 *
 * SEGURIDAD: el `mensaje` que llegue al cliente debe ser siempre genérico. Distinguir
 * "el usuario no existe" de "la contraseña es incorrecta" le regala a un atacante un
 * oráculo para enumerar cuentas válidas. El detalle real se registra en el log del
 * servidor, no en la respuesta (ver `dominio-exception.filter.ts`).
 */
export class AutenticacionFallidaError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
