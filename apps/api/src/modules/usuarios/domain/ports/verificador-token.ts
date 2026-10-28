/**
 * CAPA: domain/ports/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ PROBLEMA RESUELVE
 *   `GeneradorToken` sabe **emitir** una sesión. Para el control de acceso (US-003) hace
 *   falta la operación inversa: **verificar** que un token recibido es auténtico y no ha
 *   caducado, y extraer quién es su portador.
 *
 * POR QUÉ ES UN PUERTO APARTE Y NO UN MÉTODO MÁS EN `GeneradorToken`
 *   Segregación de interfaces (SOLID · I). Emitir y verificar los usan actores distintos:
 *   emite el caso de uso de inicio de sesión, una vez; verifica el guard, en **todas** las
 *   peticiones. Juntarlos obligaría a que cualquier doble de prueba del guard implementara
 *   también la emisión, que no necesita para nada.
 *
 * POR QUÉ DEVUELVE `null` Y NO LANZA
 *   Que un token sea inválido no es excepcional: es el caso normal de una petición sin
 *   sesión o con la sesión caducada. Quien decide qué hacer es el guard, que lo traduce a
 *   401. Que el dominio lance aquí obligaría a capturar excepciones en el camino feliz.
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
