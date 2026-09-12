/**
 * CAPA: infrastructure/persistence/
 * ────────────────────────────────────────────────────────────────────────────────
 * ADAPTADOR del puerto `UsuarioRepositorio`. Es la única clase del módulo que sabe que
 * detrás hay PostgreSQL.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { aDominio } from './usuario-prisma.mapper';

@Injectable()
export class UsuarioPrismaRepositorio implements UsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorNombreUsuario(nombreUsuario: NombreUsuario): Promise<Usuario | null> {
    // El objeto de valor ya normalizó a minúsculas, así que la búsqueda es exacta y
    // aprovecha el índice único de la columna.
    const fila = await this.prisma.usuario.findUnique({
      where: { nombreUsuario: nombreUsuario.valor },
    });

    return fila === null ? null : aDominio(fila);
  }
}
