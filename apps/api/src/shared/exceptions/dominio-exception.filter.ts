/**
 * Traduce los errores del dominio a respuestas HTTP. Es la frontera: aquí, y solo aquí, un
 * `ReglaDeNegocioError` se convierte en un 422, porque el dominio no sabe qué es un código HTTP.
 * Se registra globalmente en `main.ts` (trade-off nº2 de docs/05-arquitectura.md §2.2: manejo
 * centralizado de excepciones).
 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

import {
  AccesoDenegadoError,
  AutenticacionFallidaError,
  ErrorDeDominio,
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  TransicionInvalidaError,
} from './errores-dominio';

/**
 * Mensaje único para cualquier fallo de autenticación: el mismo si el usuario no existe, si la
 * contraseña es incorrecta o si la cuenta está desactivada. Es el criterio de US-002 y evita un
 * oráculo para enumerar cuentas.
 */
const MENSAJE_AUTENTICACION_GENERICO = 'Usuario o contraseña incorrectos';

@Catch(ErrorDeDominio)
export class DominioExceptionFilter implements ExceptionFilter<ErrorDeDominio> {
  private readonly logger = new Logger(DominioExceptionFilter.name);

  catch(excepcion: ErrorDeDominio, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();

    let estado: HttpStatus;
    if (excepcion instanceof AutenticacionFallidaError) {
      estado = HttpStatus.UNAUTHORIZED;
    } else if (excepcion instanceof AccesoDenegadoError) {
      estado = HttpStatus.FORBIDDEN;
    } else if (excepcion instanceof RecursoNoEncontradoError) {
      estado = HttpStatus.NOT_FOUND;
    } else if (
      excepcion instanceof TransicionInvalidaError ||
      excepcion instanceof RecursoDuplicadoError
    ) {
      estado = HttpStatus.CONFLICT;
    } else {
      estado = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    // El motivo real siempre se registra en el servidor, aunque no se envíe al cliente.
    this.logger.warn(`${excepcion.name}: ${excepcion.message}`);

    respuesta.status(estado).json({
      estado,
      error: excepcion.name,
      mensaje:
        excepcion instanceof AutenticacionFallidaError
          ? MENSAJE_AUTENTICACION_GENERICO
          : excepcion.message,
      timestamp: new Date().toISOString(),
    });
  }
}
