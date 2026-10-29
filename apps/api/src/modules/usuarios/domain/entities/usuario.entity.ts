/**
 * Entidad `Usuario` y las reglas de negocio que la gobiernan. TypeScript puro, sin NestJS,
 * Prisma ni HTTP, y se prueba sin levantar nada.
 *
 * Cómo se calcula el hash o se firma un token es infraestructura: el dominio solo declara los
 * puertos que necesita (`domain/ports/hasher-password.ts`, `domain/ports/generador-token.ts`).
 *
 * La entidad nunca conoce la contraseña en claro: `hashPassword` guarda el hash bcrypt y no sale
 * hacia la presentación. Es el NFR de seguridad de docs/04-product-backlog.md §5 hecho código.
 */
import { RolUsuario } from '../enums/rol-usuario.enum';
import { Cui } from '../value-objects/cui.vo';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';

import {
  AutenticacionFallidaError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';

/**
 * Política de bloqueo, criterio 3 de US-002: tras 5 intentos fallidos consecutivos, 15 minutos.
 *
 * Son constantes del dominio y no variables de entorno porque son una regla acordada con el
 * Product Owner: cambiarlas es cambiar el criterio de aceptación.
 */
export const MAX_INTENTOS_FALLIDOS = 5;
export const MINUTOS_DE_BLOQUEO = 15;

interface PropiedadesUsuario {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly hashPassword: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;
  /** Intentos fallidos consecutivos desde el último acceso correcto o el último bloqueo. */
  readonly intentosFallidos?: number;
  /** Hasta cuándo está bloqueada la cuenta. `null` si no lo está. */
  readonly bloqueadoHasta?: Date | null;
  /**
   * Identidad de la persona (US-001). Opcionales porque las cuentas creadas por el Ministerio
   * —el administrador inicial— no pasan por el registro público.
   */
  readonly nombreCompleto?: string | null;
  readonly cui?: Cui | null;
}

/** Lo que hace falta para registrar a un aspirante (US-001). */
export interface DatosNuevoEstudiante {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly hashPassword: string;
  readonly nombreCompleto: string;
  readonly cui: Cui;
}

export class Usuario {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta: Date | null;
  readonly nombreCompleto: string | null;
  readonly cui: Cui | null;

  /**
   * Campo privado de JavaScript (`#`) y no `private` de TypeScript. El segundo desaparece al
   * compilar y deja una propiedad enumerable: con `private`, `Object.keys(usuario)` incluía
   * `hashPassword` y `JSON.stringify(usuario)` lo serializaba. Un `#` es privado en ejecución: no
   * aparece al enumerar ni al serializar.
   *
   * Lo detectó la prueba `no expone el hash al serializar la entidad` con la versión anterior.
   */
  readonly #hashPassword: string;

  constructor(props: PropiedadesUsuario) {
    this.id = props.id;
    this.nombreUsuario = props.nombreUsuario;
    this.correo = props.correo;
    this.#hashPassword = props.hashPassword;
    this.rol = props.rol;
    this.activo = props.activo;
    this.intentosFallidos = props.intentosFallidos ?? 0;
    this.bloqueadoHasta = props.bloqueadoHasta ?? null;
    this.nombreCompleto = props.nombreCompleto ?? null;
    this.cui = props.cui ?? null;
  }

  /**
   * US-001 — la cuenta de un aspirante que se registra por su cuenta.
   *
   * El rol y el estado NO son parámetros: quien se registra por la vía pública es siempre
   * `ESTUDIANTE` y empieza activo. Si el rol viniera del exterior, bastaría mandar
   * `"rol": "ADMINISTRADOR"` en el formulario para darse privilegios. Aquí no hay por dónde.
   */
  static nuevoEstudiante(datos: DatosNuevoEstudiante): Usuario {
    return Usuario.cuentaNueva(datos, RolUsuario.ESTUDIANTE);
  }

  /**
   * US-017 — la cuenta de un evaluador, que crea un administrador.
   *
   * Mismo razonamiento que `nuevoEstudiante`: el rol lo fija el método, no quien llama. No existe
   * un "crear cuenta con el rol X": cada rol tiene su puerta y su caso de uso.
   */
  static nuevoEvaluador(datos: DatosNuevoEstudiante): Usuario {
    return Usuario.cuentaNueva(datos, RolUsuario.EVALUADOR);
  }

  private static cuentaNueva(datos: DatosNuevoEstudiante, rol: RolUsuario): Usuario {
    const nombreCompleto = datos.nombreCompleto.trim().replace(/\s+/g, ' ');

    if (nombreCompleto.length < 3) {
      throw new ReglaDeNegocioError('El nombre completo es obligatorio.');
    }

    return new Usuario({
      id: datos.id,
      nombreUsuario: datos.nombreUsuario,
      correo: normalizarCorreo(datos.correo),
      hashPassword: datos.hashPassword,
      rol,
      activo: true,
      nombreCompleto,
      cui: datos.cui,
    });
  }

  /**
   * El hash bcrypt almacenado, para compararlo contra la contraseña que envió el usuario.
   *
   * La comparación NO se hace aquí: requiere el algoritmo bcrypt, que es una dependencia
   * externa. El dominio la delega en `HasherPassword` (domain/ports/) y su adaptador vive
   * en infrastructure/.
   */
  hashAlmacenado(): string {
    return this.#hashPassword;
  }

  /**
   * Regla de negocio: una cuenta desactivada no puede iniciar sesión, aunque la
   * contraseña sea correcta.
   *
   * Lanza en vez de devolver un booleano para que sea imposible ignorar el resultado por
   * descuido: quien llama no tiene que acordarse de comprobar nada.
   */
  asegurarPuedeIniciarSesion(): void {
    if (!this.activo) {
      throw new AutenticacionFallidaError('La cuenta está desactivada');
    }
  }

  /**
   * ¿Está bloqueada la cuenta en este momento? El bloqueo caduca solo: pasados los 15 minutos la
   * cuenta admite intentos sin que corra ningún proceso, lo que evita una tarea programada que, si
   * fallara, dejaría cuentas bloqueadas para siempre. `ahora` llega por parámetro, como en
   * `Convocatoria`, para probar la regla en cualquier instante.
   */
  estaBloqueado(ahora: Date): boolean {
    return this.bloqueadoHasta !== null && this.bloqueadoHasta.getTime() > ahora.getTime();
  }

  /**
   * Devuelve el usuario con un intento fallido más. Al quinto la cuenta se bloquea 15 minutos y
   * el contador vuelve a cero: si no, al caducar el bloqueo un solo fallo la bloquearía otra vez
   * y el criterio dice cinco intentos.
   *
   * Devuelve un usuario nuevo porque la entidad es inmutable (campos `readonly`). El caso de uso
   * decide persistirlo; el dominio decide la regla, no cuándo se guarda.
   */
  conIntentoFallido(ahora: Date): Usuario {
    const intentos = this.intentosFallidos + 1;

    if (intentos >= MAX_INTENTOS_FALLIDOS) {
      return this.copiar({
        intentosFallidos: 0,
        bloqueadoHasta: new Date(ahora.getTime() + MINUTOS_DE_BLOQUEO * 60 * 1000),
      });
    }

    return this.copiar({ intentosFallidos: intentos, bloqueadoHasta: this.bloqueadoHasta });
  }

  /** Devuelve el usuario con el contador y el bloqueo limpios, tras un acceso correcto. */
  conAccesoCorrecto(): Usuario {
    return this.copiar({ intentosFallidos: 0, bloqueadoHasta: null });
  }

  /** ¿Hay estado de intentos que valga la pena limpiar? Evita escrituras inútiles. */
  tieneIntentosRegistrados(): boolean {
    return this.intentosFallidos > 0 || this.bloqueadoHasta !== null;
  }

  /**
   * Devuelve el usuario con otra contraseña y desbloqueado (US-035). Lo segundo no es un extra:
   * quien olvidó su contraseña suele haber fallado varias veces, y restablecerla sin desbloquear
   * le devolvería una llave a una puerta trabada. Además demostró tener acceso al correo, una
   * prueba de identidad más fuerte que el contador de intentos.
   */
  conNuevaPassword(hashPassword: string): Usuario {
    return this.copiar({ intentosFallidos: 0, bloqueadoHasta: null, hashPassword });
  }

  private copiar(cambios: {
    intentosFallidos: number;
    bloqueadoHasta: Date | null;
    hashPassword?: string;
  }): Usuario {
    // El hash se copia mediante `hashAlmacenado()`: el campo `#` no es accesible ni siquiera
    // desde otra instancia por desestructuración, y así sigue sin poder filtrarse.
    return new Usuario({
      id: this.id,
      nombreUsuario: this.nombreUsuario,
      correo: this.correo,
      hashPassword: cambios.hashPassword ?? this.hashAlmacenado(),
      rol: this.rol,
      activo: this.activo,
      nombreCompleto: this.nombreCompleto,
      cui: this.cui,
      ...cambios,
    });
  }

  /** Conveniencia para el control de acceso por rol del Sprint 2 (US-003). */
  esAdministrador(): boolean {
    return this.rol === RolUsuario.ADMINISTRADOR;
  }
}

/**
 * Los correos se comparan sin distinguir mayúsculas: `Ana@Mail.com` y `ana@mail.com` son el
 * mismo buzón, y tienen que chocar contra la misma restricción de unicidad.
 */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}
