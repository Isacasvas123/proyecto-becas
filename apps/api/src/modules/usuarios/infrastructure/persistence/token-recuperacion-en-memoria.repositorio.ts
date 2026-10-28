/**
 * El mismo puerto, en memoria.
 *
 * Lo usan las pruebas de integración, que montan la plataforma entera sin PostgreSQL.
 */
import { Injectable } from '@nestjs/common';

import { TokenRecuperacion } from '../../domain/entities/token-recuperacion.entity';
import { TokenRecuperacionRepositorio } from '../../domain/ports/token-recuperacion.repositorio';

@Injectable()
export class TokenRecuperacionEnMemoriaRepositorio implements TokenRecuperacionRepositorio {
  private readonly tokens = new Map<string, TokenRecuperacion>();

  crear(token: TokenRecuperacion): Promise<void> {
    this.tokens.set(token.id, token);
    return Promise.resolve();
  }

  buscarPorHash(hashToken: string): Promise<TokenRecuperacion | null> {
    const encontrado = [...this.tokens.values()].find((t) => t.hashToken === hashToken);
    return Promise.resolve(encontrado ?? null);
  }

  marcarUsadoEInvalidarLosDemas(token: TokenRecuperacion): Promise<void> {
    const ahora = token.usadoEn ?? new Date();

    for (const [id, otro] of this.tokens) {
      if (otro.usuarioId !== token.usuarioId || otro.usadoEn !== null) continue;
      this.tokens.set(
        id,
        TokenRecuperacion.reconstituir({
          id: otro.id,
          usuarioId: otro.usuarioId,
          hashToken: otro.hashToken,
          expiraEn: otro.expiraEn,
          usadoEn: ahora,
          creadoEn: otro.creadoEn,
        }),
      );
    }
    return Promise.resolve();
  }
}
