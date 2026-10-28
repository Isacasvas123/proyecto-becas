/**
 * Límite de intentos de recuperación por dirección (US-035).
 *
 * POR QUÉ HACE FALTA AQUÍ
 *   Las dos rutas de recuperación son públicas, y cada una se puede abusar de una manera
 *   distinta:
 *
 *   - `POST /auth/recuperacion` manda un correo. Sin límite, cualquiera podría usar el
 *     sistema para inundar el buzón de otra persona, o para ir probando direcciones.
 *   - `POST /auth/recuperacion/confirmar` prueba un token. Sin límite se podría intentar
 *     adivinarlo por fuerza bruta. Con 256 bits eso ya es inviable, pero un límite lo cierra
 *     del todo y además abarata el coste de cada intento fallido.
 *
 *   Es el mismo mecanismo que `LimiteConsultasGuard` de US-025, con otro umbral: cinco
 *   intentos cada quince minutos. Recuperar una contraseña es algo que se hace una vez;
 *   quien lo intenta cinco veces seguidas o se equivocó mucho, o no es quien dice ser.
 *
 * LIMITACIÓN CONOCIDA
 *   El conteo vive en la memoria del proceso: con varias instancias de la API cada una
 *   cuenta por su lado, y se reinicia al reiniciar. Para una instancia —Staging— alcanza.
 *   Con más, se mueve a un almacén compartido sin tocar el caso de uso.
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
