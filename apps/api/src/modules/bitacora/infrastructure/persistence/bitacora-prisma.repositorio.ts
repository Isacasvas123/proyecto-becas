/**
 * La bitácora en PostgreSQL. Implementa el puerto del dominio, que no tiene forma de modificar
 * ni borrar: aquí tampoco se escriben esos métodos.
 */
import { Injectable } from '@nestjs/common';
import { Prisma, RegistroBitacora as FilaBitacora } from '@prisma/client';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { RegistroBitacora } from '../../domain/entities/registro-bitacora.entity';
import {
  BitacoraRepositorio,
  FiltroBitacora,
  PaginaBitacora,
} from '../../domain/ports/bitacora.repositorio';

@Injectable()
export class BitacoraPrismaRepositorio implements BitacoraRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(registro: RegistroBitacora): Promise<void> {
    await this.prisma.registroBitacora.create({
      data: {
        actorId: registro.actor.id,
        actorUsuario: registro.actor.nombreUsuario,
        actorRol: aRolPrisma(registro.actor.rol),
        accion: registro.accion,
        entidad: registro.entidad,
        entidadId: registro.entidadId,
        resultado: registro.resultado,
        origen: registro.origen,
        ocurridoEn: registro.ocurridoEn,
      },
    });
  }

  async consultar(filtro: FiltroBitacora): Promise<PaginaBitacora> {
    const where: Prisma.RegistroBitacoraWhereInput = {
      ...(filtro.actorId === undefined ? {} : { actorId: filtro.actorId }),
      ...(filtro.rol === undefined ? {} : { actorRol: aRolPrisma(filtro.rol) }),
      ...(filtro.entidad === undefined ? {} : { entidad: filtro.entidad }),
      ...(filtro.soloRechazadas === true ? { resultado: { gte: 400 } } : {}),
      ...(filtro.desde === undefined && filtro.hasta === undefined
        ? {}
        : {
            ocurridoEn: {
              ...(filtro.desde === undefined ? {} : { gte: filtro.desde }),
              ...(filtro.hasta === undefined ? {} : { lte: filtro.hasta }),
            },
          }),
    };

    // Las dos consultas en una transacción: el total y la página deben verse coherentes aunque
    // lleguen asientos nuevos mientras se consulta, que en una bitácora pasa todo el tiempo.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.registroBitacora.findMany({
        where,
        orderBy: { ocurridoEn: 'desc' },
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
      this.prisma.registroBitacora.count({ where }),
    ]);

    return { registros: filas.map(aDominio), total };
  }

  async entidades(): Promise<string[]> {
    const grupos = await this.prisma.registroBitacora.groupBy({
      by: ['entidad'],
      where: { entidad: { not: null } },
      orderBy: { entidad: 'asc' },
    });
    return grupos.map((g) => g.entidad).filter((e): e is string => e !== null);
  }
}

/**
 * El enum de Prisma y el del dominio tienen los mismos valores, pero son tipos distintos. Se
 * traducen a mano, como en `usuario-prisma.mapper`: si alguien agrega un rol en el esquema y no
 * en el dominio, falla aquí en vez de guardar un valor que el dominio no reconoce.
 */
function aRolPrisma(rol: RolUsuario | null): FilaBitacora['actorRol'] {
  return rol === null ? null : (rol as FilaBitacora['actorRol']);
}

function aRolDominio(rol: FilaBitacora['actorRol']): RolUsuario | null {
  if (rol === null) return null;
  const equivalente = RolUsuario[rol as keyof typeof RolUsuario];
  if (equivalente === undefined) {
    throw new Error(
      `El rol "${rol}" existe en el esquema de Prisma pero no en RolUsuario del dominio`,
    );
  }
  return equivalente;
}

function aDominio(fila: FilaBitacora): RegistroBitacora {
  return new RegistroBitacora({
    actor: {
      id: fila.actorId,
      nombreUsuario: fila.actorUsuario,
      rol: aRolDominio(fila.actorRol),
    },
    accion: fila.accion,
    entidad: fila.entidad,
    entidadId: fila.entidadId,
    resultado: fila.resultado,
    origen: fila.origen,
    ocurridoEn: fila.ocurridoEn,
  });
}
