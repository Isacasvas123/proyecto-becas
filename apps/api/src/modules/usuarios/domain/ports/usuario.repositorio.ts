/**
 * Puerto de persistencia de usuarios. Mismo patrón que `ConvocatoriaRepositorio`:
 * el dominio declara qué necesita e infrastructure decide cómo.
 */
import { Usuario } from '../entities/usuario.entity';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { Cui } from '../value-objects/cui.vo';
import { NombreUsuario } from '../value-objects/nombre-usuario.vo';

export const USUARIO_REPOSITORIO = Symbol('UsuarioRepositorio');

export interface UsuarioRepositorio {
  /**
   * Busca por nombre de usuario; devuelve `null` si no existe. Es `null` y no una excepción
   * porque que no exista es un resultado esperable del inicio de sesión, y el caso de uso lo
   * convierte en el mismo fallo genérico que una contraseña incorrecta (US-002).
   */
  buscarPorNombreUsuario(nombreUsuario: NombreUsuario): Promise<Usuario | null>;

  /**
   * Persiste el contador de intentos fallidos y el bloqueo (US-002, criterio 3).
   *
   * Es un método estrecho y no un `guardar(usuario)` general porque el inicio de sesión solo tiene
   * derecho a tocar esos dos campos: uno general permitiría que un error pisara el rol, el correo
   * o el hash.
   */
  actualizarEstadoDeAcceso(usuario: Usuario): Promise<void>;

  /** US-035: por aquí empieza la recuperación, que solo conoce el correo. */
  buscarPorCorreo(correo: string): Promise<Usuario | null>;

  /**
   * Guarda la contraseña nueva y el desbloqueo, nada más.
   *
   * Deliberadamente estrecho, por el mismo motivo que `actualizarEstadoDeAcceso`: un
   * `guardar()` general permitiría que un fallo en este caso de uso sobrescribiera el rol
   * o el correo de alguien. Lo que este flujo puede tocar, lo dice su firma.
   */
  actualizarPassword(usuario: Usuario): Promise<void>;

  /**
   * US-001: ¿qué datos de un registro nuevo ya están tomados? Se consulta todo junto para poder
   * decirle a la persona exactamente cuál es el problema en una sola respuesta.
   */
  buscarDuplicados(datos: {
    correo: string;
    cui: Cui;
    nombreUsuario: NombreUsuario;
  }): Promise<CamposDuplicados>;

  /**
   * US-001: guarda una cuenta nueva. Si otra petición registró el mismo correo, CUI o nombre de
   * usuario entre la comprobación y la escritura, el adaptador debe lanzar
   * `RecursoDuplicadoError`: solo la base garantiza la unicidad bajo concurrencia, y la
   * comprobación previa sirve para dar un buen mensaje.
   */
  crear(usuario: Usuario): Promise<void>;

  /** US-017: las cuentas de un rol, ordenadas por nombre. Para elegir integrantes de un comité. */
  listarPorRol(rol: RolUsuario): Promise<Usuario[]>;

  /** Varias cuentas por id. Los ids que no existan simplemente no aparecen. */
  buscarPorIds(ids: readonly string[]): Promise<Usuario[]>;
}

export interface CamposDuplicados {
  readonly correo: boolean;
  readonly cui: boolean;
  readonly nombreUsuario: boolean;
}
