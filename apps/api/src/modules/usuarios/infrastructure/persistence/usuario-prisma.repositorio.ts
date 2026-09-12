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

  async actualizarEstadoDeAcceso(usuario: Usuario): Promise<void> {
    // Solo los dos campos del bloqueo. Ver el comentario del puerto.
    //
    // LIMITACIÓN CONOCIDA: es lectura-modificación-escritura. Si llegaran varias peticiones
    // fallidas EXACTAMENTE a la vez, podrían contarse como menos intentos de los reales. Para
    // el volumen de este sistema el riesgo es bajo y está documentado; la solución completa
    // sería un `increment` atómico en la base, que obligaría a mover la regla del bloqueo
    // fuera del dominio. Se prefirió conservar la regla en la entidad.
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: usuario.intentosFallidos,
        bloqueadoHasta: usuario.bloqueadoHasta,
      },
    });
  }
}
