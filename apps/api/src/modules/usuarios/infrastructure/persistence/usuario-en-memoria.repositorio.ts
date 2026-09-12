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
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';

export class UsuarioEnMemoriaRepositorio implements UsuarioRepositorio {
  constructor(private readonly usuarios: Usuario[] = []) {}

  buscarPorNombreUsuario(nombreUsuario: NombreUsuario): Promise<Usuario | null> {
    const encontrado = this.usuarios.find((usuario) => usuario.nombreUsuario.equals(nombreUsuario));

    return Promise.resolve(encontrado ?? null);
  }
}
