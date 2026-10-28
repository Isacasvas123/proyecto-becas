/**
 * Adaptador: implementa el puerto `ConvocatoriaRepositorio` del dominio. Aquí, y solo aquí, se
 * habla de tablas, índices y consultas.
 *
 * No decide qué es una convocatoria visible, eso lo define la entidad; solo traduce esa
 * definición a una consulta eficiente. La clase importa del dominio y el dominio no importa nada
 * de ella: esa asimetría es la arquitectura hexagonal.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { ConvocatoriaRepositorio } from '../../domain/ports/convocatoria.repositorio';
import { aDominio, aPersistencia } from './convocatoria-prisma.mapper';

@Injectable()
export class ConvocatoriaPrismaRepositorio implements ConvocatoriaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPublicadasVigentes(ahora: Date): Promise<Convocatoria[]> {
    // El filtro se hace en la base de datos, no en memoria: el listado público debe
    // responder en menos de 1 segundo aunque haya decenas de miles de registros
    // (NFR de rendimiento, docs/04-product-backlog.md). El índice compuesto
    // [estado, fechaCierre] del schema.prisma existe exactamente para esta consulta.
    const filas = await this.prisma.convocatoria.findMany({
      where: {
        estado: 'PUBLICADA',
        fechaCierre: { gte: ahora },
      },
      orderBy: { fechaCierre: 'asc' },
    });

    return filas.map(aDominio);
  }

  async buscarTodas(): Promise<Convocatoria[]> {
    // Las más recientes primero: es lo que el administrador busca al entrar al panel.
    const filas = await this.prisma.convocatoria.findMany({ orderBy: { creadaEn: 'desc' } });
    return filas.map(aDominio);
  }

  async buscarPorId(id: string): Promise<Convocatoria | null> {
    const fila = await this.prisma.convocatoria.findUnique({ where: { id } });
    return fila === null ? null : aDominio(fila);
  }

  async guardar(convocatoria: Convocatoria): Promise<void> {
    const datos = aPersistencia(convocatoria);
    await this.prisma.convocatoria.upsert({
      where: { id: convocatoria.id },
      create: datos,
      update: datos,
    });
  }

  async contarConPrefijoDeCodigo(prefijo: string): Promise<number> {
    return this.prisma.convocatoria.count({ where: { codigo: { startsWith: prefijo } } });
  }
}
