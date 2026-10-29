/**
 * Implementa `GeneradorToken` con un JWT firmado (HS256), patrón Adapter.
 *
 * Dentro del token va solo el id, el nombre de usuario y el rol: nunca el correo, el hash ni
 * datos personales, porque el payload va firmado pero no cifrado y cualquiera que lo intercepte
 * puede leerlo.
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
      // y el `expiraEn` que se devuelve al cliente salgan del mismo cálculo. Si el módulo
      // fijara su propio `expiresIn`, ambos podrían discrepar sin que nada lo detectara.
      { expiresIn: segundosVigencia },
    );

    return { valor, expiraEn };
  }
}
