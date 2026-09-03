/**
 * Traduce los errores del dominio a respuestas HTTP.
 *
 * Este archivo es la frontera: aquí —y solo aquí— un `ReglaDeNegocioError` se convierte en
 * un 422. El dominio no sabe qué es un código HTTP y debe seguir sin saberlo.
 *
 * Se registra globalmente en `main.ts`. Cubre el trade-off nº2 de
 * docs/05-arquitectura.md §2.2: "manejo centralizado de excepciones".
 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

import { ErrorDeDominio, TransicionInvalidaError } from './errores-dominio';

@Catch(ErrorDeDominio)
export class DominioExceptionFilter implements ExceptionFilter<ErrorDeDominio> {
  private readonly logger = new Logger(DominioExceptionFilter.name);

  catch(excepcion: ErrorDeDominio, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();

    const estado =
      excepcion instanceof TransicionInvalidaError
        ? HttpStatus.CONFLICT
        : HttpStatus.UNPROCESSABLE_ENTITY;

    this.logger.warn(`${excepcion.name}: ${excepcion.message}`);

    respuesta.status(estado).json({
      estado,
      error: excepcion.name,
      mensaje: excepcion.message,
      timestamp: new Date().toISOString(),
    });
  }
}
