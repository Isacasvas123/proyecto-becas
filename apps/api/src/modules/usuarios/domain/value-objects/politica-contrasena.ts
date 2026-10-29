/**
 * Política de contraseñas, criterio 2 de US-001: mínimo 8 caracteres, una mayúscula y un número.
 *
 * Es una regla del dominio y no un decorador del DTO porque se acordó con el Product Owner y, si
 * cambia, debe cambiar en un solo lugar que se prueba sin HTTP; con `@Matches` en el DTO, el
 * registro por otra vía, como una importación masiva, se la saltaría.
 *
 * Dice cuál condición falla porque, a diferencia del login, aquí no le da nada a un atacante: la
 * persona está creando su contraseña. Solo valida: la contraseña en claro no viaja como objeto,
 * se valida, se hashea y se descarta.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export const LONGITUD_MINIMA_CONTRASENA = 8;

/**
 * bcrypt solo considera los primeros 72 bytes. Una contraseña más larga se truncaría en
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
