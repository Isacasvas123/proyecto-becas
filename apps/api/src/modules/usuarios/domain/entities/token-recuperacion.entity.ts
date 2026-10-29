/**
 * Permiso de un solo uso para restablecer una contraseña olvidada (US-035).
 *
 * Mientras vive, este token equivale a la contraseña, así que la entidad guarda solo su hash,
 * igual que `Usuario`: si alguien lee la base, no puede tomar ninguna cuenta.
 *
 * Tres reglas lo hacen seguro, y viven aquí para que no se puedan saltar usando la entidad por
 * otro camino: caduca; se usa una sola vez; y al usarse mueren los demás tokens de esa persona,
 * así pedir el enlace cinco veces no deja cinco llaves vivas.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

/**
 * Una hora: más corto y el enlace caduca mientras la persona busca el correo; más largo y queda
 * una llave viva en un buzón que puede no ser suyo. Es lo habitual en este tipo de servicios.
 */
export const VIGENCIA_MINUTOS = 60;

export interface AtributosToken {
  readonly id: string;
  readonly usuarioId: string;
  readonly hashToken: string;
  readonly expiraEn: Date;
  readonly usadoEn: Date | null;
  readonly creadoEn: Date;
}

export class TokenRecuperacion {
  private constructor(private readonly atributos: AtributosToken) {}

  static nuevo(datos: {
    id: string;
    usuarioId: string;
    hashToken: string;
    ahora: Date;
  }): TokenRecuperacion {
    return new TokenRecuperacion({
      id: datos.id,
      usuarioId: datos.usuarioId,
      hashToken: datos.hashToken,
      expiraEn: new Date(datos.ahora.getTime() + VIGENCIA_MINUTOS * 60_000),
      usadoEn: null,
      creadoEn: datos.ahora,
    });
  }

  static reconstituir(atributos: AtributosToken): TokenRecuperacion {
    return new TokenRecuperacion(atributos);
  }

  get id(): string {
    return this.atributos.id;
  }

  get usuarioId(): string {
    return this.atributos.usuarioId;
  }

  get hashToken(): string {
    return this.atributos.hashToken;
  }

  get expiraEn(): Date {
    return this.atributos.expiraEn;
  }

  get usadoEn(): Date | null {
    return this.atributos.usadoEn;
  }

  get creadoEn(): Date {
    return this.atributos.creadoEn;
  }

  /** ¿Sirve todavía? Un token usado o caducado no vale, y los dos casos se tratan igual. */
  estaVigente(ahora: Date): boolean {
    return this.atributos.usadoEn === null && ahora.getTime() <= this.atributos.expiraEn.getTime();
  }

  /**
   * Lo marca como usado. Lanza si ya no servía.
   *
   * El mensaje es el mismo para caducado y para ya usado: a quien tiene el enlace en la mano
   * le da igual el motivo, y a quien lo esté probando no se le regala información.
   */
  usar(ahora: Date): TokenRecuperacion {
    if (!this.estaVigente(ahora)) {
      throw new ReglaDeNegocioError(
        'Este enlace ya no es válido. Solicite uno nuevo desde la pantalla de acceso.',
      );
    }
    return new TokenRecuperacion({ ...this.atributos, usadoEn: ahora });
  }
}
