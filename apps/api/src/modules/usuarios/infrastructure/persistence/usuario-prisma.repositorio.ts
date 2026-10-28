/**
 * Adaptador del puerto `UsuarioRepositorio`. Es la única clase del módulo que sabe que
 * detrás hay PostgreSQL.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { normalizarCorreo, Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { CamposDuplicados, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { aDominio, aRolPersistible } from './usuario-prisma.mapper';

/** Código de Prisma para "se violó una restricción de unicidad". */
const VIOLACION_UNICIDAD = 'P2002';

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

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { correo } });
    return fila === null ? null : aDominio(fila);
  }

  /** Solo la contraseña y el desbloqueo. Ver el comentario del puerto. */
  async actualizarPassword(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        hashPassword: usuario.hashAlmacenado(),
        intentosFallidos: usuario.intentosFallidos,
        bloqueadoHasta: usuario.bloqueadoHasta,
      },
    });
  }

  async actualizarEstadoDeAcceso(usuario: Usuario): Promise<void> {
    // Solo los dos campos del bloqueo. Ver el comentario del puerto.
    //
    // Limitación conocida: es lectura-modificación-escritura. Si llegaran varias peticiones
    // fallidas exactamente a la vez, podrían contarse como menos intentos de los reales. Para
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

  async buscarDuplicados(datos: {
    correo: string;
    cui: Cui;
    nombreUsuario: NombreUsuario;
  }): Promise<CamposDuplicados> {
    const correo = normalizarCorreo(datos.correo);
    const filas = await this.prisma.usuario.findMany({
      where: {
        OR: [{ correo }, { cui: datos.cui.valor }, { nombreUsuario: datos.nombreUsuario.valor }],
      },
      select: { correo: true, cui: true, nombreUsuario: true },
    });

    return {
      correo: filas.some((f) => f.correo === correo),
      cui: filas.some((f) => f.cui === datos.cui.valor),
      nombreUsuario: filas.some((f) => f.nombreUsuario === datos.nombreUsuario.valor),
    };
  }

  async crear(usuario: Usuario): Promise<void> {
    try {
      await this.prisma.usuario.create({
        data: {
          id: usuario.id,
          nombreUsuario: usuario.nombreUsuario.valor,
          correo: usuario.correo,
          hashPassword: usuario.hashAlmacenado(),
          rol: aRolPersistible(usuario.rol),
          activo: usuario.activo,
          nombreCompleto: usuario.nombreCompleto,
          cui: usuario.cui?.valor ?? null,
        },
      });
    } catch (error) {
      // Dos registros simultáneos con el mismo CUI pasan los dos la comprobación previa; la
      // base rechaza el segundo. Se traduce al error del dominio para que el cliente reciba un
      // 409 claro y no un 500.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === VIOLACION_UNICIDAD
      ) {
        throw new RecursoDuplicadoError('Ya existe una cuenta con esos datos.');
      }
      throw error;
    }
  }

  async listarPorRol(rol: RolUsuario): Promise<Usuario[]> {
    const filas = await this.prisma.usuario.findMany({
      where: { rol: aRolPersistible(rol) },
      orderBy: [{ nombreCompleto: 'asc' }, { nombreUsuario: 'asc' }],
    });
    return filas.map(aDominio);
  }

  async buscarPorIds(ids: readonly string[]): Promise<Usuario[]> {
    if (ids.length === 0) return [];
    const filas = await this.prisma.usuario.findMany({ where: { id: { in: [...ids] } } });
    return filas.map(aDominio);
  }
}
