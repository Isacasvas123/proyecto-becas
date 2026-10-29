/**
 * Cuentas de evaluador (parte de US-017).
 *
 * Un comité se forma con usuarios de rol EVALUADOR (precondición de CU-13) y ninguna historia
 * decía cómo se crean. Decisión del equipo del 16 de septiembre: las crea un administrador desde
 * la gestión; la vía pública (US-001) solo crea estudiantes.
 *
 * `resumenes` es cómo otros módulos conocen el nombre de una persona sin tocar la entidad
 * `Usuario` ni su hash.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { HASHER_PASSWORD, HasherPassword } from '../../domain/ports/hasher-password';
import { USUARIO_REPOSITORIO, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { ComandoCuentaNueva, prepararCuentaNueva } from './cuenta-nueva';

/** Lo que se puede mostrar de una cuenta. Nunca el hash, nunca el CUI. */
export interface ResumenCuentaDto {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly nombreUsuario: string;
  readonly correo: string;
  readonly rol: string;
  readonly activo: boolean;
}

@Injectable()
export class CuentasEvaluadorService {
  private readonly logger = new Logger(CuentasEvaluadorService.name);

  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly repositorio: UsuarioRepositorio,
    @Inject(HASHER_PASSWORD)
    private readonly hasher: HasherPassword,
  ) {}

  async crear(comando: ComandoCuentaNueva): Promise<ResumenCuentaDto> {
    const usuario = Usuario.nuevoEvaluador(
      await prepararCuentaNueva(comando, randomUUID(), this.repositorio, this.hasher),
    );
    await this.repositorio.crear(usuario);
    this.logger.log(`Evaluador creado: ${usuario.nombreUsuario.valor}`);
    return aResumen(usuario);
  }

  async listar(): Promise<ResumenCuentaDto[]> {
    return (await this.repositorio.listarPorRol(RolUsuario.EVALUADOR)).map(aResumen);
  }

  async resumenes(ids: readonly string[]): Promise<ResumenCuentaDto[]> {
    return (await this.repositorio.buscarPorIds(ids)).map(aResumen);
  }
}

function aResumen(usuario: Usuario): ResumenCuentaDto {
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto ?? usuario.nombreUsuario.valor,
    nombreUsuario: usuario.nombreUsuario.valor,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
  };
}
