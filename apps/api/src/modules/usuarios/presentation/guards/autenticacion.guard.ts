/**
 * CAPA: presentation/guards/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-003 — Control de acceso. **Esta es la seguridad de verdad.**
 *
 * La guardia del frontend (`RutaProtegida.tsx`) solo evita que un usuario legítimo vea una
 * pantalla vacía: cualquiera puede saltársela desde las herramientas del navegador. Quien
 * impide de verdad el acceso es este guard, porque corre en el servidor.
 *
 * Es una pregunta previsible en la defensa: *"si escondo el botón en el frontend, ¿ya está
 * protegido?"*. La respuesta es no, y este archivo es la razón.
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTÁ EN presentation/ Y NO EN domain/
 *   Porque un guard es un concepto de HTTP: lee cabeceras, decide códigos de estado y
 *   depende de `ExecutionContext` de NestJS. El dominio no sabe qué es una petición HTTP y
 *   debe seguir sin saberlo. Lo único que aporta el dominio aquí es el puerto
 *   `VerificadorToken`, que este guard consume sin saber que detrás hay un JWT.
 *
 * QUÉ HACE Y QUÉ NO HACE
 *   Verifica que el token sea auténtico y vigente, y que el rol baste para la ruta. **No**
 *   consulta la base de datos en cada petición: el token es autocontenido y esa es su
 *   ventaja. El precio, aceptado conscientemente, es que desactivar un usuario no invalida
 *   su token hasta que caduque, como máximo 8 horas después. Si el Ministerio exigiera
 *   revocación inmediata habría que añadir una lista de revocación, y eso cambia el diseño.
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
   * Extrae el token de la cabecera `Authorization: Bearer <token>`.
   *
   * Se exige el esquema `Bearer` explícitamente. Aceptar la cabecera pelada sería más
   * cómodo y menos seguro: cualquier cadena arbitraria entraría al verificador.
   *
   * ────────────────────────────────────────────────────────────────────────────────
   * DOS ARISTAS SEÑALADAS POR FERNANDO EN LA REVISIÓN DEL PR #4
   *
   * 1. CABECERA DUPLICADA. Si un cliente manda dos cabeceras `Authorization`, Node las
   *    une con coma: `"Bearer aaa, Bearer bbb"`. Partir por espacios daba `valor = "aaa,"`,
   *    que el verificador rechazaba por firma inválida — no era una fuga, pero el rechazo
   *    ocurría por accidente y no por decisión. Ahora se rechaza aquí, explícitamente:
   *    una petición con dos credenciales es ambigua y no se adivina cuál vale.
   *
   * 2. ESQUEMA EN MINÚSCULA. El RFC 7235 §2.1 define el nombre del esquema como
   *    *case-insensitive*, así que `bearer token` es una petición VÁLIDA que estábamos
   *    rechazando con un 401. Era un fallo de interoperabilidad, no una medida de
   *    seguridad: comparar sin distinguir mayúsculas no debilita nada, porque lo que
   *    autentica es el token, no cómo se escriba la palabra.
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
