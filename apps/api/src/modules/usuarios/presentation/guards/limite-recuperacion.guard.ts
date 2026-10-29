/**
 * Límite de intentos de recuperación por dirección (US-035).
 *
 * Las dos rutas son públicas y se abusan distinto: `POST /auth/recuperacion` manda un correo y,
 * sin límite, serviría para inundar un buzón o probar direcciones; `POST /auth/recuperacion/
 * confirmar` prueba un token y, sin límite, se podría intentar adivinarlo por fuerza bruta. Con
 * 256 bits es inviable, pero el límite lo cierra y abarata cada intento fallido.
 *
 * Es el mecanismo de `LimiteConsultasGuard` (US-025) con otro umbral: cinco intentos cada quince
 * minutos. Recuperar una contraseña se hace una vez.
 *
 * El conteo vive en la memoria del proceso: con varias instancias cada una cuenta por su lado.
 * Para Staging alcanza; con más se mueve a un almacén compartido.
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const LIMITE = 5;
const VENTANA_MS = 15 * 60 * 1000;

@Injectable()
export class LimiteRecuperacionGuard implements CanActivate {
  private readonly intentos = new Map<string, number[]>();

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const clave = peticion.ip ?? 'desconocida';
    const ahora = Date.now();
    const recientes = (this.intentos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);

    if (recientes.length >= LIMITE) {
      this.intentos.set(clave, recientes);
      throw new HttpException(
        'Demasiados intentos de recuperación. Espere unos minutos antes de volver a intentarlo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.intentos.set(clave, [...recientes, ahora]);
    return true;
  }
}
