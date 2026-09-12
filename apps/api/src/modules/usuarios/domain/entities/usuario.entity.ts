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

interface PropiedadesUsuario {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly hashPassword: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;
}

export class Usuario {
  readonly id: string;
  readonly nombreUsuario: NombreUsuario;
  readonly correo: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;

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

  /** Conveniencia para el control de acceso por rol del Sprint 2 (US-003). */
  esAdministrador(): boolean {
    return this.rol === RolUsuario.ADMINISTRADOR;
  }
}
