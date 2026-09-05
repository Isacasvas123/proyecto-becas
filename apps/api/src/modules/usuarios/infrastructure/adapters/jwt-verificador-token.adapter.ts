/**
 * CAPA: infrastructure/adapters/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * Implementa `VerificadorToken` con JWT. Es la única clase que sabe que la sesión viaja
 * como un JSON Web Token firmado con HS256.
 *
 * SEGURIDAD — POR QUÉ SE CAPTURA CUALQUIER ERROR Y SE DEVUELVE `null`
 *   `jwt.verifyAsync` lanza excepciones distintas según el motivo: firma inválida, token
 *   caducado, formato corrupto. Distinguirlas en la respuesta le diría a un atacante si su
 *   token es "casi válido", que es información útil para él y para nadie más. Todas
 *   producen el mismo resultado: no hay portador.
 *
 *   El motivo real sí se registra en el log del servidor, en nivel `debug`, para poder
 *   diagnosticar sin ruido en producción.
 */
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PortadorToken, VerificadorToken } from '../../domain/ports/verificador-token';

/** Forma del payload que emite `JwtGeneradorTokenAdapter`. */
interface PayloadJwt {
  sub?: unknown;
  nombreUsuario?: unknown;
  rol?: unknown;
}

@Injectable()
export class JwtVerificadorTokenAdapter implements VerificadorToken {
  private readonly logger = new Logger(JwtVerificadorTokenAdapter.name);

  constructor(private readonly jwt: JwtService) {}

  async verificar(token: string): Promise<PortadorToken | null> {
    try {
      const payload = await this.jwt.verifyAsync<PayloadJwt>(token);
      return this.aPortador(payload);
    } catch (error) {
      this.logger.debug(`Token rechazado: ${String(error)}`);
      return null;
    }
  }

  /**
   * Un token puede estar correctamente firmado y aun así traer un payload incompleto: por
   * ejemplo si lo emitió una versión anterior del sistema con otra forma. Se valida la
   * estructura antes de confiar en ella.
   */
  private aPortador(payload: PayloadJwt): PortadorToken | null {
    const { sub, nombreUsuario, rol } = payload;

    if (typeof sub !== 'string' || typeof nombreUsuario !== 'string' || typeof rol !== 'string') {
      this.logger.warn('Token con firma válida pero payload incompleto. Se rechaza.');
      return null;
    }

    return { usuarioId: sub, nombreUsuario, rol };
  }
}
