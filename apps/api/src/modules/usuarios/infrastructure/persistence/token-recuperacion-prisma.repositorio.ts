/**
 * Adaptador de `TokenRecuperacionRepositorio`.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { TokenRecuperacion } from '../../domain/entities/token-recuperacion.entity';
import { TokenRecuperacionRepositorio } from '../../domain/ports/token-recuperacion.repositorio';

@Injectable()
export class TokenRecuperacionPrismaRepositorio implements TokenRecuperacionRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async crear(token: TokenRecuperacion): Promise<void> {
    await this.prisma.tokenRecuperacion.create({
      data: {
        id: token.id,
        usuarioId: token.usuarioId,
        hashToken: token.hashToken,
        expiraEn: token.expiraEn,
        usadoEn: token.usadoEn,
        creadoEn: token.creadoEn,
      },
    });
  }

  async buscarPorHash(hashToken: string): Promise<TokenRecuperacion | null> {
    const fila = await this.prisma.tokenRecuperacion.findUnique({ where: { hashToken } });
    return fila === null
      ? null
      : TokenRecuperacion.reconstituir({
          id: fila.id,
          usuarioId: fila.usuarioId,
          hashToken: fila.hashToken,
          expiraEn: fila.expiraEn,
          usadoEn: fila.usadoEn,
          creadoEn: fila.creadoEn,
        });
  }

  /**
   * Los dos pasos van en UNA transacción.
   *
   * Si se hicieran por separado y fallara el segundo, quedarían vivos los demás permisos de
   * esa persona después de haber cambiado su contraseña: cualquiera con un enlace viejo
   * podría volver a cambiarla. O las dos cosas pasan, o no pasa ninguna.
   */
  async marcarUsadoEInvalidarLosDemas(token: TokenRecuperacion): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.tokenRecuperacion.update({
        where: { id: token.id },
        data: { usadoEn: token.usadoEn },
      }),
      this.prisma.tokenRecuperacion.updateMany({
        where: { usuarioId: token.usuarioId, usadoEn: null },
        data: { usadoEn: token.usadoEn },
      }),
    ]);
  }
}
