/**
 * ADAPTADORES de persistencia de `evaluaciones`. Las únicas clases del módulo que saben que detrás
 * hay PostgreSQL.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Asignacion, Comite } from '../../domain/entities/comite.entity';
import { Dictamen } from '../../domain/entities/dictamen.entity';
import { Recomendacion } from '../../domain/enums/recomendacion.enum';
import { ComiteRepositorio } from '../../domain/ports/comite.repositorio';
import { DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';
import { LineaDesglose } from '../../domain/strategies/criterio-evaluacion.strategy';
import { Puntaje } from '../../domain/value-objects/puntaje.vo';

const VIOLACION_UNICIDAD = 'P2002';

const esDuplicado = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === VIOLACION_UNICIDAD;

const CON_INTEGRANTES = {
  integrantes: { orderBy: { agregadoEn: 'asc' } },
} satisfies Prisma.ComiteInclude;

type FilaComite = Prisma.ComiteGetPayload<{ include: typeof CON_INTEGRANTES }>;

@Injectable()
export class ComitePrismaRepositorio implements ComiteRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Comite | null> {
    const fila = await this.prisma.comite.findUnique({ where: { id }, include: CON_INTEGRANTES });
    return fila === null ? null : aComite(fila);
  }

  async buscarPorConvocatoria(convocatoriaId: string): Promise<Comite | null> {
    const fila = await this.prisma.comite.findUnique({
      where: { convocatoriaId },
      include: CON_INTEGRANTES,
    });
    return fila === null ? null : aComite(fila);
  }

  async listar(): Promise<Comite[]> {
    const filas = await this.prisma.comite.findMany({
      include: CON_INTEGRANTES,
      orderBy: { creadoEn: 'desc' },
    });
    return filas.map(aComite);
  }

  /**
   * Comité e integrantes en una transacción. La tabla de integrantes queda **igual a la entidad**:
   * se agregan los nuevos y se borran los que ya no están.
   *
   * Antes solo se agregaban, porque quitar no existía (CU-13, 5a). Al implementarlo, la prueba de
   * humo contra PostgreSQL destapó la consecuencia: la entidad quitaba a la persona, la respuesta
   * la mostraba fuera, pero la fila seguía en la base. Al recargar el comité volvía a aparecer, y
   * con ella la comprobación de "no dejar el comité vacío" dejaba de valer.
   */
  async guardar(comite: Comite): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.comite.upsert({
          where: { id: comite.id },
          create: {
            id: comite.id,
            nombre: comite.nombre,
            convocatoriaId: comite.convocatoriaId,
            creadoPorId: comite.creadoPor,
            creadoEn: comite.creadoEn,
          },
          update: { nombre: comite.nombre },
        });
        await tx.comiteEvaluador.createMany({
          data: comite.evaluadores.map((evaluadorId) => ({ comiteId: comite.id, evaluadorId })),
          skipDuplicates: true,
        });
        await tx.comiteEvaluador.deleteMany({
          where: { comiteId: comite.id, evaluadorId: { notIn: [...comite.evaluadores] } },
        });
      });
    } catch (error) {
      if (esDuplicado(error)) {
        throw new RecursoDuplicadoError('Esa convocatoria ya tiene un comité.');
      }
      throw error;
    }
  }

  async guardarAsignaciones(asignaciones: readonly Asignacion[]): Promise<void> {
    await this.prisma.asignacionEvaluacion.createMany({
      data: asignaciones.map((a) => ({
        comiteId: a.comiteId,
        solicitudId: a.solicitudId,
        evaluadorId: a.evaluadorId,
        asignadaPorId: a.asignadaPor,
        asignadaEn: a.asignadaEn,
      })),
      skipDuplicates: true,
    });
  }

  async eliminarAsignaciones(
    comiteId: string,
    evaluadorId: string,
    solicitudIds: readonly string[],
  ): Promise<void> {
    if (solicitudIds.length === 0) return;
    await this.prisma.asignacionEvaluacion.deleteMany({
      where: { comiteId, evaluadorId, solicitudId: { in: [...solicitudIds] } },
    });
  }

  async asignacionesDeComite(comiteId: string): Promise<Asignacion[]> {
    const filas = await this.prisma.asignacionEvaluacion.findMany({
      where: { comiteId },
      orderBy: { asignadaEn: 'asc' },
    });
    return filas.map(aAsignacion);
  }

  async asignacionesDeEvaluador(evaluadorId: string): Promise<Asignacion[]> {
    const filas = await this.prisma.asignacionEvaluacion.findMany({
      where: { evaluadorId },
      orderBy: { asignadaEn: 'asc' },
    });
    return filas.map(aAsignacion);
  }

  async estaAsignada(solicitudId: string, evaluadorId: string): Promise<boolean> {
    const fila = await this.prisma.asignacionEvaluacion.findUnique({
      where: { solicitudId_evaluadorId: { solicitudId, evaluadorId } },
      select: { id: true },
    });
    return fila !== null;
  }
}

@Injectable()
export class DictamenPrismaRepositorio implements DictamenRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async crear(d: Dictamen): Promise<void> {
    try {
      await this.prisma.dictamen.create({
        data: {
          id: d.id,
          solicitudId: d.solicitudId,
          evaluadorId: d.evaluadorId,
          criterio: d.criterio,
          puntaje: d.puntaje.valor,
          desglose: d.desglose as unknown as Prisma.InputJsonValue,
          recomendacion: d.recomendacion,
          observacion: d.observacion,
          emitidoEn: d.emitidoEn,
        },
      });
    } catch (error) {
      if (esDuplicado(error)) {
        throw new RecursoDuplicadoError(
          'Ya emitió su dictamen para esta solicitud; no se modifica.',
        );
      }
      throw error;
    }
  }

  async buscar(solicitudId: string, evaluadorId: string): Promise<Dictamen | null> {
    const fila = await this.prisma.dictamen.findUnique({
      where: { solicitudId_evaluadorId: { solicitudId, evaluadorId } },
    });
    return fila === null ? null : aDictamen(fila);
  }

  async deSolicitudes(ids: readonly string[]): Promise<Dictamen[]> {
    if (ids.length === 0) return [];
    const filas = await this.prisma.dictamen.findMany({
      where: { solicitudId: { in: [...ids] } },
      orderBy: { emitidoEn: 'asc' },
    });
    return filas.map(aDictamen);
  }

  async deEvaluador(evaluadorId: string): Promise<Dictamen[]> {
    const filas = await this.prisma.dictamen.findMany({
      where: { evaluadorId },
      orderBy: { emitidoEn: 'asc' },
    });
    return filas.map(aDictamen);
  }
}

function aComite(fila: FilaComite): Comite {
  return Comite.reconstituir({
    id: fila.id,
    nombre: fila.nombre,
    convocatoriaId: fila.convocatoriaId,
    evaluadores: fila.integrantes.map((i) => i.evaluadorId),
    creadoPor: fila.creadoPorId,
    creadoEn: fila.creadoEn,
  });
}

function aAsignacion(fila: Prisma.AsignacionEvaluacionGetPayload<object>): Asignacion {
  return {
    comiteId: fila.comiteId,
    solicitudId: fila.solicitudId,
    evaluadorId: fila.evaluadorId,
    asignadaPor: fila.asignadaPorId,
    asignadaEn: fila.asignadaEn,
  };
}

function aDictamen(fila: Prisma.DictamenGetPayload<object>): Dictamen {
  return Dictamen.reconstituir({
    id: fila.id,
    solicitudId: fila.solicitudId,
    evaluadorId: fila.evaluadorId,
    criterio: fila.criterio,
    puntaje: Puntaje.de(Number(fila.puntaje)),
    desglose: fila.desglose as unknown as LineaDesglose[],
    recomendacion: fila.recomendacion as Recomendacion,
    observacion: fila.observacion,
    emitidoEn: fila.emitidoEn,
  });
}
