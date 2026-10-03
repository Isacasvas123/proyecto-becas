/**
 * CAPA: domain/value-objects/
 * ────────────────────────────────────────────────────────────────────────────────
 * Política de contraseñas — criterio 2 de US-001, textual:
 * *"La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un número."*
 *
 * POR QUÉ ES UNA REGLA DEL DOMINIO Y NO UN DECORADOR DEL DTO
 *   Porque es una regla de negocio acordada con el Product Owner, y el día que la cambie —más
 *   larga, con símbolos— el cambio tiene que entrar en un solo lugar que se prueba sin HTTP.
 *   Un `@Matches(/regex/)` en el DTO dejaría la regla en la capa de presentación, y el
 *   registro desde cualquier otra vía (una importación masiva, por ejemplo) se la saltaría.
 *
 * POR QUÉ DICE CUÁL CONDICIÓN FALLA
 *   Al contrario que en el inicio de sesión, aquí el mensaje específico no le da nada útil a un
 *   atacante: la persona está creando SU contraseña. Decirle "le falta una mayúscula" le ahorra
 *   adivinar.
 *
 * NO GUARDA LA CONTRASEÑA
 *   Solo valida. La contraseña en claro no se convierte en un objeto que viaje por el sistema:
 *   se valida, se le calcula el hash y se descarta.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export const LONGITUD_MINIMA_CONTRASENA = 8;

/**
 * bcrypt solo considera los primeros 72 BYTES. Una contraseña más larga se truncaría en
 * silencio: dos contraseñas distintas con los mismos 72 primeros bytes serían equivalentes. Se
 * mide en bytes y no en caracteres porque una vocal con tilde ocupa dos.
 */
export const BYTES_MAXIMOS_CONTRASENA = 72;

export function validarPoliticaContrasena(contrasena: string): void {
  const faltantes: string[] = [];

  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    faltantes.push(`al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`);
  }
  if (!/[A-ZÁÉÍÓÚÑ]/.test(contrasena)) {
    faltantes.push('al menos una letra mayúscula');
  }
  if (!/\d/.test(contrasena)) {
    faltantes.push('al menos un número');
  }

  if (faltantes.length > 0) {
    throw new ReglaDeNegocioError(`La contraseña debe tener ${faltantes.join(', ')}.`);
  }

  if (Buffer.byteLength(contrasena, 'utf8') > BYTES_MAXIMOS_CONTRASENA) {
    throw new ReglaDeNegocioError(
      `La contraseña no puede superar los ${BYTES_MAXIMOS_CONTRASENA} bytes.`,
    );
  }
}
