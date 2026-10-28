/**
 * CAPA: domain/ports/
 *
 * Lo que el dominio necesita de donde se guarden los permisos de recuperación (US-035).
 * No dice PostgreSQL ni Prisma: eso lo resuelve el adaptador.
 */
import { TokenRecuperacion } from '../entities/token-recuperacion.entity';

export const TOKEN_RECUPERACION_REPOSITORIO = Symbol('TokenRecuperacionRepositorio');

export interface TokenRecuperacionRepositorio {
  crear(token: TokenRecuperacion): Promise<void>;

  /** Se busca por el HASH porque el valor en claro no se guarda en ninguna parte. */
  buscarPorHash(hashToken: string): Promise<TokenRecuperacion | null>;

  /**
   * Marca uno como usado y **invalida todos los demás de esa persona**, en la misma
   * operación. Si fueran dos pasos, un fallo entre ellos dejaría llaves vivas.
   */
  marcarUsadoEInvalidarLosDemas(token: TokenRecuperacion): Promise<void>;
}
