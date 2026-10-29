/**
 * Puerto para verificar la credencial de sesión (patrón Adapter, estructural).
 *
 * Hace falta la operación inversa a `GeneradorToken` (US-003): comprobar que un token es
 * auténtico y vigente y extraer quién lo porta. Es un puerto aparte por segregación de
 * interfaces (SOLID · I): emite el caso de uso de login una vez y verifica el guard en cada
 * petición, y juntarlos obligaría a que un doble del guard implementara también la emisión.
 *
 * Devuelve `null` y no lanza porque un token inválido es el caso normal de una petición sin
 * sesión o con la sesión caducada; el guard lo traduce a 401.
 */

/** Lo que viaja dentro del token. Nunca datos personales: el payload va firmado, no cifrado. */
export interface PortadorToken {
  readonly usuarioId: string;
  readonly nombreUsuario: string;
  readonly rol: string;
}

export const VERIFICADOR_TOKEN = Symbol('VerificadorToken');

export interface VerificadorToken {
  /** Devuelve el portador si el token es auténtico y vigente; `null` en cualquier otro caso. */
  verificar(token: string): Promise<PortadorToken | null>;
}
