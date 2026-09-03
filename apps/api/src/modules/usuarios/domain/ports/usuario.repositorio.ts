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
}
