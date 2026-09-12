/**
 * CAPA: infrastructure/persistence/  ·  PLANTILLA DE REFERENCIA DEL PROYECTO
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   El ADAPTADOR: la implementación concreta del puerto `ConvocatoriaRepositorio` que
 *   declara el dominio. Aquí —y solo aquí— se habla de tablas, índices y consultas.
 *
 * QUÉ NO VA AQUÍ
 *   Reglas de negocio. Este archivo no decide qué significa "convocatoria visible": eso
 *   lo define la entidad. Aquí solo se traduce esa definición a una consulta eficiente.
 *
 * FÍJENSE EN LA DIRECCIÓN DE LA FLECHA
 *   Esta clase importa del dominio (`implements ConvocatoriaRepositorio`); el dominio no
 *   importa nada de aquí. Esa asimetría es toda la arquitectura hexagonal en una línea.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { ConvocatoriaRepositorio } from '../../domain/ports/convocatoria.repositorio';
import { aDominio } from './convocatoria-prisma.mapper';

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
}
