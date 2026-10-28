/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   La entidad `Usuario` y las REGLAS DE NEGOCIO que la gobiernan. TypeScript puro: ni
 *   NestJS, ni Prisma, ni HTTP. Se prueba sin levantar nada (ver `usuario.entity.spec.ts`).
 *
 * QUÉ NO VA AQUÍ
 *   Cómo se calcula el hash de la contraseña ni cómo se firma un token. Eso es
 *   infraestructura: el dominio solo declara los puertos que necesita
 *   (`domain/ports/hasher-password.ts`, `domain/ports/generador-token.ts`).
 *
 * DECISIÓN IMPORTANTE — LA ENTIDAD NUNCA CONOCE LA CONTRASEÑA EN CLARO
 *   `hashPassword` guarda el hash bcrypt y jamás sale de la entidad hacia la capa de
 *   presentación. Es el NFR de seguridad de docs/04-product-backlog.md §5 hecho código:
 *   aunque alguien serializara un `Usuario` por error, no hay contraseña que filtrar.
 */
import { RolUsuario } from '../enums/rol-usuario.enum';
import { Cui } from '../value-objects/cui.vo';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';

import {
  AutenticacionFallidaError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';

/**
 * POLÍTICA DE BLOQUEO — criterio 3 de US-002, textual:
 * *"Tras 5 intentos fallidos consecutivos, la cuenta se bloquea 15 minutos."*
 *
 * Son constantes del DOMINIO y no variables de entorno a propósito: son una regla de negocio
 * acordada con el Product Owner, no un ajuste operativo. Cambiarlas es cambiar el criterio de
 * aceptación, y eso pasa por el backlog, no por un `.env`.
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
   * CAMPO PRIVADO DE JAVASCRIPT (`#`), NO `private` DE TYPESCRIPT.
   *
   * La diferencia es de seguridad real, no de estilo. El modificador `private` de
   * TypeScript solo existe en tiempo de compilación: al transpilar desaparece y el campo
   * queda como una propiedad normal y enumerable. Con `private`, esto filtraba el hash:
   *
   *     Object.keys(usuario)   →  [..., 'hashPassword']
   *     JSON.stringify(usuario) →  {..., "hashPassword": "$2b$10$..."}
   *
   * Un `#` es privado de verdad en tiempo de ejecución: no aparece al enumerar, no se
   * serializa y no es accesible desde fuera de la clase ni con notación de corchetes.
   *
   * Se detectó porque la prueba `no expone el hash al serializar la entidad` falló con la
   * versión anterior. Es exactamente el tipo de defecto que una prueba de seguridad debe
   * atrapar antes de que llegue a producción.
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
   * REGLA DE NEGOCIO: una cuenta desactivada no puede iniciar sesión, aunque la
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
   * REGLA DE NEGOCIO: ¿está bloqueada la cuenta en este momento?
   *
   * El bloqueo **caduca solo**: no hace falta que nadie lo levante. Pasados los 15 minutos la
   * cuenta vuelve a admitir intentos sin que ningún proceso tenga que ejecutarse. Eso evita
   * una tarea programada que, si fallara, dejaría cuentas bloqueadas para siempre.
   *
   * `ahora` se recibe como parámetro, igual que en `Convocatoria`: la regla es determinista y
   * se prueba en cualquier instante sin relojes falsos.
   */
  estaBloqueado(ahora: Date): boolean {
    return this.bloqueadoHasta !== null && this.bloqueadoHasta.getTime() > ahora.getTime();
  }

  /**
   * Devuelve el usuario con un intento fallido más registrado.
   *
   * Al llegar al quinto, la cuenta queda bloqueada 15 minutos **y el contador vuelve a cero**.
   * Si no volviera a cero, al caducar el bloqueo un solo intento fallido más la bloquearía de
   * nuevo, y el criterio dice cinco intentos, no uno.
   *
   * POR QUÉ DEVUELVE UN USUARIO NUEVO Y NO MODIFICA ESTE
   *   La entidad es inmutable: todos sus campos son `readonly`. Mutarla aquí rompería esa
   *   garantía para todo el código que ya confía en ella. El caso de uso recibe el estado nuevo
   *   y decide persistirlo; el dominio decide la regla, no cuándo se guarda.
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
   * Devuelve el usuario con otra contraseña, y de paso DESBLOQUEADO (US-035).
   *
   * Lo segundo no es un extra: alguien que olvidó su contraseña suele haber fallado varias
   * veces antes de pedir el enlace, así que lo normal es que llegue aquí con la cuenta
   * bloqueada. Restablecerla y dejarlo fuera igual sería devolverle una llave a una puerta
   * que sigue trabada. Además, quien llega hasta aquí ya demostró tener acceso al correo
   * de la cuenta, que es una prueba de identidad más fuerte que el contador de intentos.
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
