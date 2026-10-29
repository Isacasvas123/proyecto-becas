/**
 * Puerto para emitir la credencial de sesión (patrón Adapter, estructural).
 *
 * El dominio necesita entregar "algo que acredite la sesión" pero no debe saber que es un JWT
 * HS256: mañana podría ser una sesión en servidor o un token opaco. Por eso el puerto habla de
 * `TokenSesion` y no de "JWT".
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
