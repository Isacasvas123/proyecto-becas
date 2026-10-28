/**
 * US-003: control de acceso. La guardia del frontend (`RutaProtegida.tsx`) solo evita que un
 * usuario legítimo vea una pantalla vacía y se salta desde el navegador; el control real es este
 * guard, porque corre en el servidor.
 *
 * Va en presentation/ porque un guard es HTTP: lee cabeceras, decide códigos y depende de
 * `ExecutionContext`. Del dominio solo consume el puerto `VerificadorToken`, sin saber que detrás
 * hay un JWT.
 *
 * No consulta la base en cada petición: el token es autocontenido. El precio, aceptado, es que
 * desactivar un usuario no invalida su token hasta que caduque, 8 horas como máximo. Una
 * revocación inmediata exigiría una lista de revocación y cambiaría el diseño.
 */
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../../domain/ports/verificador-token';
import { CLAVE_PUBLICO } from './decoradores';

/** Extiende la petición con el portador ya verificado, para que lo lean los controladores. */
export interface PeticionAutenticada extends Request {
  portador?: PortadorToken;
}

@Injectable()
export class AutenticacionGuard implements CanActivate {
  private readonly logger = new Logger(AutenticacionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(VERIFICADOR_TOKEN)
    private readonly verificador: VerificadorToken,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // `getAllAndOverride` permite marcar público un controlador entero y aun así proteger
    // un método concreto, o al revés: gana lo más específico.
    const esPublica = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (esPublica === true) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<PeticionAutenticada>();
    const token = this.extraerToken(peticion);

    if (token === null) {
      throw new UnauthorizedException('Se requiere iniciar sesión');
    }

    const portador = await this.verificador.verificar(token);

    if (portador === null) {
      this.logger.warn(`Token rechazado en ${peticion.method} ${peticion.url}`);
      // Mensaje idéntico al de arriba: distinguir "falta token" de "token inválido" no
      // aporta nada al usuario legítimo y sí a quien esté tanteando.
      throw new UnauthorizedException('Se requiere iniciar sesión');
    }

    // Se adjunta a la petición para que los controladores sepan quién actúa sin volver a
    // decodificar el token.
    peticion.portador = portador;
    return true;
  }

  /**
   * Extrae el token de `Authorization: Bearer <token>`. Se exige el esquema `Bearer`: aceptar la
   * cabecera pelada dejaría entrar cualquier cadena al verificador.
   *
   * Dos casos que señaló Fernando en la revisión del PR #4:
   *
   * 1. Cabecera duplicada. Node une dos `Authorization` con coma y el token quedaba como `"aaa,"`,
   *    que el verificador rechazaba por firma: no había fuga, pero el rechazo era accidental. Ahora
   *    se rechaza aquí, porque una petición con dos credenciales es ambigua.
   * 2. Esquema en minúscula. El RFC 7235 §2.1 define el esquema como insensible a mayúsculas, así
   *    que `bearer token` es válido y se rechazaba con 401. Era un fallo de interoperabilidad y
   *    no debilita nada, porque lo que autentica es el token.
   */
  private extraerToken(peticion: Request): string | null {
    const cabecera = peticion.headers.authorization;

    if (typeof cabecera !== 'string') {
      return null;
    }

    // Arista 1: credenciales múltiples. Se rechaza en vez de elegir una.
    if (cabecera.includes(',')) {
      this.logger.warn(
        `Cabecera Authorization con credenciales múltiples en ${peticion.method} ${peticion.url}`,
      );
      return null;
    }

    const partes = cabecera.trim().split(/\s+/);

    if (partes.length !== 2) {
      return null;
    }

    const [esquema, valor] = partes;

    // Arista 2: el esquema es case-insensitive por RFC 7235; el token NO se normaliza.
    return esquema.toLowerCase() === 'bearer' && valor.length > 0 ? valor : null;
  }
}
