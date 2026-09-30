/**
 * CAPA: domain/ports/
 * ────────────────────────────────────────────────────────────────────────────────
 * Puerto de persistencia de usuarios. Mismo patrón que `ConvocatoriaRepositorio`:
 * el dominio declara QUÉ necesita, infrastructure decide CÓMO.
 */
import { Usuario } from '../entities/usuario.entity';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';

export const USUARIO_REPOSITORIO = Symbol('UsuarioRepositorio');

export interface UsuarioRepositorio {
  /**
   * Busca por nombre de usuario. Devuelve `null` si no existe.
   *
   * POR QUÉ `null` Y NO UNA EXCEPCIÓN: que un usuario no exista es un resultado
   * esperable del inicio de sesión, no un error excepcional. Quien decide cómo tratarlo
   * es el caso de uso, y lo convierte en el mismo fallo genérico que una contraseña
   * incorrecta (US-002).
   *
   * SPRINT 2: aquí se agregarán `guardar()` y `buscarPorCorreo()` cuando lleguen el
   * registro (US-001) y la recuperación de contraseña (US-005).
   */
  buscarPorNombreUsuario(nombreUsuario: NombreUsuario): Promise<Usuario | null>;

  /**
   * Persiste el contador de intentos fallidos y el bloqueo (US-002, criterio 3).
   *
   * POR QUÉ UN MÉTODO TAN ESTRECHO Y NO UN `guardar(usuario)` GENERAL
   *   Porque el inicio de sesión solo tiene derecho a tocar esos dos campos. Un `guardar`
   *   general permitiría que un error en este caso de uso sobrescribiera el rol, el correo o
   *   el hash. El puerto expresa lo que el caso de uso necesita, no lo que la tabla permite.
   */
  actualizarEstadoDeAcceso(usuario: Usuario): Promise<void>;
}
