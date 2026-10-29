/**
 * Errores del dominio. TypeScript puro: el dominio los lanza y por eso no puede depender de
 * `HttpException` de NestJS. La traducción a código HTTP ocurre en la frontera
 * (`dominio-exception.filter.ts`). Viven en `shared/` porque los módulos de negocio los comparten.
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
 * Es un error de dominio y no un `NotFoundException` de NestJS para que el caso de uso lo
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
 * Las credenciales no son válidas o la cuenta no puede iniciar sesión (US-002). El `mensaje` que
 * llegue al cliente debe ser siempre genérico: distinguir "no existe" de "contraseña incorrecta"
 * le da a un atacante un oráculo para enumerar cuentas. El detalle real va al log del servidor
 * (ver `dominio-exception.filter.ts`).
 */
export class AutenticacionFallidaError extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
