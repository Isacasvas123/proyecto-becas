/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * Permiso de un solo uso para restablecer una contraseña olvidada (US-035).
 *
 * QUÉ PROTEGE
 *   Durante su vida, este token ES la contraseña: quien lo tenga puede cambiarla. Por eso
 *   la entidad solo guarda su HASH, igual que `Usuario` con la contraseña. El valor en
 *   claro existe una sola vez —el instante en que se crea y se mete en el correo— y no se
 *   vuelve a conocer. Si alguien lee la base de datos, no puede tomar ninguna cuenta.
 *
 * LAS TRES REGLAS QUE LO HACEN SEGURO
 *   1. Caduca. Un enlace de hace tres meses en un buzón ajeno no sirve de nada.
 *   2. Se usa UNA vez. Reenviar el mismo enlace no vuelve a abrir la puerta.
 *   3. Al usarse, los demás tokens de esa persona mueren. Pedir el enlace cinco veces no
 *      deja cinco llaves vivas.
 *
 *   Las tres viven aquí y no en el servicio, para que no haya forma de saltárselas usando
 *   la entidad por otro camino.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

/**
 * Una hora.
 *
 * El equilibrio es entre dos molestias: demasiado corto y el enlace caduca mientras la
 * persona busca el correo; demasiado largo y queda una llave viva en un buzón que puede no
 * ser suyo para siempre. Una hora es el valor que usan la mayoría de los servicios y alcanza
 * de sobra para abrir un correo.
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
