/**
 * CAPA: domain/ports/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * El dominio necesita entregarle al usuario "algo que acredite su sesión", pero no debe
 * saber que ese algo es un JWT firmado con HS256. Mañana podría ser una sesión en
 * servidor o un token opaco; el caso de uso no cambiaría.
 *
 * Por eso el puerto habla de `TokenSesion` y no de "JWT": el vocabulario es del dominio,
 * no de la biblioteca.
 */
import { Usuario } from '../entities/usuario.entity';

export const GENERADOR_TOKEN = Symbol('GeneradorToken');

export interface TokenSesion {
  /** La credencial que el cliente enviará en las siguientes peticiones. */
  readonly valor: string;
  /** Momento en que deja de ser válida. */
  readonly expiraEn: Date;
}

export interface GeneradorToken {
  emitir(usuario: Usuario): Promise<TokenSesion>;
}
