import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * US-013, criterio 2: el rechazo por tamaño lleva un mensaje específico.
 *
 * Un archivo muy grande lo corta `multer` antes de que llegue al dominio, y el mensaje por
 * defecto es "File too large", en inglés. Este filtro lo traduce, con la misma forma de cuerpo que
 * el resto de errores de la API.
 */
@Catch(PayloadTooLargeException)
export class ArchivoDemasiadoGrandeFilter implements ExceptionFilter {
  catch(_excepcion: PayloadTooLargeException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      estado: HttpStatus.PAYLOAD_TOO_LARGE,
      error: 'ArchivoDemasiadoGrande',
      mensaje: 'El archivo supera el máximo permitido de 5 MB.',
      timestamp: new Date().toISOString(),
    });
  }
}
