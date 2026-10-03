/**
 * Límite de consultas públicas por dirección (US-025).
 *
 * La consulta pública no tiene sesión, y sin límite un script podría probar números y CUI sin
 * parar. Se permiten `LIMITE` consultas por dirección cada `VENTANA_MS`; la siguiente recibe 429.
 *
 * LIMITACIÓN CONOCIDA
 *   El conteo vive en la memoria del proceso: con varias instancias de la API, cada una cuenta por
 *   su lado, y se reinicia al reiniciar. Para una instancia —Staging— es suficiente. Con más, se
 *   mueve a un almacén compartido sin tocar el caso de uso.
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

export const LIMITE = 10;
export const VENTANA_MS = 60_000;

@Injectable()
export class LimiteConsultasGuard implements CanActivate {
  private readonly intentos = new Map<string, number[]>();

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const clave = peticion.ip ?? 'desconocida';
    const ahora = Date.now();
    const recientes = (this.intentos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);

    if (recientes.length >= LIMITE) {
      this.intentos.set(clave, recientes);
      throw new HttpException(
        {
          estado: HttpStatus.TOO_MANY_REQUESTS,
          error: 'DemasiadasConsultas',
          mensaje: 'Hizo demasiadas consultas seguidas. Espere un minuto e intente de nuevo.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recientes.push(ahora);
    this.intentos.set(clave, recientes);
    // Limpieza oportunista para que el mapa no crezca sin fin.
    if (this.intentos.size > 10_000) {
      for (const [ip, tiempos] of this.intentos) {
        if (tiempos.every((t) => ahora - t >= VENTANA_MS)) this.intentos.delete(ip);
      }
    }
    return true;
  }
}
