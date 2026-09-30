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
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';

import { AutenticacionFallidaError } from '../../../../shared/exceptions/errores-dominio';

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
}

export class Usuario {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta: Date | null;

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

  private copiar(cambios: { intentosFallidos: number; bloqueadoHasta: Date | null }): Usuario {
    // El hash se copia mediante `hashAlmacenado()`: el campo `#` no es accesible ni siquiera
    // desde otra instancia por desestructuración, y así sigue sin poder filtrarse.
    return new Usuario({
      id: this.id,
      nombreUsuario: this.nombreUsuario,
      correo: this.correo,
      hashPassword: this.hashAlmacenado(),
      rol: this.rol,
      activo: this.activo,
      ...cambios,
    });
  }

  /** Conveniencia para el control de acceso por rol del Sprint 2 (US-003). */
  esAdministrador(): boolean {
    return this.rol === RolUsuario.ADMINISTRADOR;
  }
}
