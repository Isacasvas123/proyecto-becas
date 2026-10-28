/**
 * CAPA: infrastructure/persistence/
 * ────────────────────────────────────────────────────────────────────────────────
 * Segundo ADAPTADOR del mismo puerto, esta vez en memoria.
 *
 * PARA QUÉ SIRVE
 *   Es la demostración práctica de por qué existe la inversión de dependencias: la
 *   prueba del caso de uso le inyecta esta clase en lugar del repositorio Prisma y corre
 *   en milisegundos, sin Docker, sin PostgreSQL y sin datos compartidos entre pruebas.
 *
 *   Que el servicio acepte ambas implementaciones sin cambiar una línea es la
 *   verificación de que el principio de sustitución de Liskov se cumple
 *   (docs/05-arquitectura.md §2.4).
 */
import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { normalizarCorreo, Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { Cui } from '../../domain/value-objects/cui.vo';
import { CamposDuplicados, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';

export class UsuarioEnMemoriaRepositorio implements UsuarioRepositorio {
  constructor(private readonly usuarios: Usuario[] = []) {}

  buscarPorNombreUsuario(nombreUsuario: NombreUsuario): Promise<Usuario | null> {
    const encontrado = this.usuarios.find((usuario) => usuario.nombreUsuario.equals(nombreUsuario));

    return Promise.resolve(encontrado ?? null);
  }

  buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return Promise.resolve(this.usuarios.find((u) => u.correo === correo) ?? null);
  }

  actualizarPassword(usuario: Usuario): Promise<void> {
    return this.actualizarEstadoDeAcceso(usuario);
  }

  actualizarEstadoDeAcceso(usuario: Usuario): Promise<void> {
    const indice = this.usuarios.findIndex((existente) => existente.id === usuario.id);

    if (indice >= 0) {
      this.usuarios[indice] = usuario;
    }

    return Promise.resolve();
  }

  buscarDuplicados(datos: {
    correo: string;
    cui: Cui;
    nombreUsuario: NombreUsuario;
  }): Promise<CamposDuplicados> {
    const correo = normalizarCorreo(datos.correo);
    return Promise.resolve({
      correo: this.usuarios.some((u) => u.correo === correo),
      cui: this.usuarios.some((u) => u.cui !== null && u.cui.equals(datos.cui)),
      nombreUsuario: this.usuarios.some((u) => u.nombreUsuario.equals(datos.nombreUsuario)),
    });
  }

  crear(usuario: Usuario): Promise<void> {
    // Mismo contrato que la base de datos: la unicidad se garantiza al escribir, no solo en la
    // comprobación previa del caso de uso.
    const choca = this.usuarios.some(
      (u) =>
        u.correo === usuario.correo ||
        u.nombreUsuario.equals(usuario.nombreUsuario) ||
        (u.cui !== null && usuario.cui !== null && u.cui.equals(usuario.cui)),
    );
    if (choca) {
      return Promise.reject(new RecursoDuplicadoError('Ya existe una cuenta con esos datos.'));
    }
    this.usuarios.push(usuario);
    return Promise.resolve();
  }

  listarPorRol(rol: RolUsuario): Promise<Usuario[]> {
    return Promise.resolve(
      this.usuarios
        .filter((u) => u.rol === rol)
        .sort((a, b) => (a.nombreCompleto ?? '').localeCompare(b.nombreCompleto ?? '')),
    );
  }

  buscarPorIds(ids: readonly string[]): Promise<Usuario[]> {
    return Promise.resolve(this.usuarios.filter((u) => ids.includes(u.id)));
  }
}
