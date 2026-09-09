/**
 * CAPA: infrastructure/adapters/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * Implementa el puerto `GeneradorToken` con JWT firmado (HS256).
 *
 * QUÉ VA DENTRO DEL TOKEN
 *   Solo el identificador del usuario, su nombre y su rol. NUNCA el correo, ni el hash,
 *   ni datos personales: el payload de un JWT va firmado pero NO cifrado, así que
 *   cualquiera que lo intercepte puede leerlo.
 *
 * SPRINT 2
 *   Aquí falta el `JwtAuthGuard` que valide el token en las peticiones siguientes y el
 *   decorador de roles. Es US-003 y se implementa con el control de acceso.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Usuario } from '../../domain/entities/usuario.entity';
import { GeneradorToken, TokenSesion } from '../../domain/ports/generador-token';

/** Vigencia por defecto, coherente con `JWT_EXPIRACION` de .env.example. */
const HORAS_VIGENCIA_POR_DEFECTO = 8;

@Injectable()
export class JwtGeneradorTokenAdapter implements GeneradorToken {
  private readonly horasVigencia: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    const configurada = config.get<string>('JWT_EXPIRACION') ?? '';
    const horas = Number(configurada.replace(/h$/i, ''));
    this.horasVigencia = Number.isFinite(horas) && horas > 0 ? horas : HORAS_VIGENCIA_POR_DEFECTO;
  }

  async emitir(usuario: Usuario): Promise<TokenSesion> {
    const segundosVigencia = this.horasVigencia * 60 * 60;
    const expiraEn = new Date(Date.now() + segundosVigencia * 1000);

    const valor = await this.jwt.signAsync(
      {
        sub: usuario.id,
        nombreUsuario: usuario.nombreUsuario.valor,
        rol: usuario.rol,
      },
      // La vigencia se pasa en segundos y desde aquí, para que el `exp` interno del token
      // y el `expiraEn` que se devuelve al cliente salgan del MISMO cálculo. Si el módulo
      // fijara su propio `expiresIn`, ambos podrían discrepar sin que nada lo detectara.
      { expiresIn: segundosVigencia },
    );

    return { valor, expiraEn };
  }
}
