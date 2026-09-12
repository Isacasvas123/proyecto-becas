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

import {
  AutenticacionFallidaError,
  ErrorDeDominio,
  TransicionInvalidaError,
} from './errores-dominio';

/**
 * Mensaje único para cualquier fallo de autenticación.
 *
 * Se responde exactamente lo mismo tanto si el usuario no existe como si la contraseña es
 * incorrecta o la cuenta está desactivada. Es el criterio de aceptación de US-002
 * ("mensaje genérico, sin revelar cuál de los dos falló") y evita dar un oráculo de
 * enumeración de cuentas.
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
    } else if (excepcion instanceof TransicionInvalidaError) {
      estado = HttpStatus.CONFLICT;
    } else {
      estado = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    // El motivo REAL siempre se registra en el servidor, aunque no se envíe al cliente.
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
