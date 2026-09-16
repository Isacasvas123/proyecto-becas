import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { SolicitudRepositorio } from '../../domain/ports/solicitud.repositorio';

const CON_DETALLE = {
  documentos: true,
  historial: { orderBy: { ocurridoEn: 'asc' } },
} satisfies Prisma.SolicitudInclude;

type FilaSolicitud = Prisma.SolicitudGetPayload<{ include: typeof CON_DETALLE }>;

@Injectable()
export class SolicitudPrismaRepositorio implements SolicitudRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Solicitud | null> {
    const fila = await this.prisma.solicitud.findUnique({ where: { id }, include: CON_DETALLE });
    return fila === null ? null : aDominio(fila);
  }

  async buscarPorEstudiante(estudianteId: string): Promise<Solicitud[]> {
    const filas = await this.prisma.solicitud.findMany({
      where: { estudianteId },
      include: CON_DETALLE,
      orderBy: { creadaEn: 'desc' },
    });
    return filas.map(aDominio);
  }

  async buscarActiva(estudianteId: string, convocatoriaId: string): Promise<Solicitud | null> {
    const fila = await this.prisma.solicitud.findFirst({
      where: { estudianteId, convocatoriaId, estado: { not: NombreEstado.RECHAZADA } },
      include: CON_DETALLE,
    });
    return fila === null ? null : aDominio(fila);
  }

  contarConPrefijoDeNumero(prefijo: string): Promise<number> {
    return this.prisma.solicitud.count({ where: { numero: { startsWith: prefijo } } });
  }

  /**
   * En una sola transacción: la solicitud, sus documentos y las entradas nuevas del historial.
   * Si algo falla no queda un documento guardado con la solicitud en el estado anterior.
   */
  async guardar(solicitud: Solicitud): Promise<void> {
    const documentos = solicitud.listaDocumentos();

    await this.prisma.$transaction(async (tx) => {
      const datos = {
        estado: solicitud.nombreEstado,
        enviadaEn: solicitud.enviadaEn,
      };
      await tx.solicitud.upsert({
        where: { id: solicitud.id },
        create: {
          id: solicitud.id,
          numero: solicitud.numero,
          estudianteId: solicitud.estudianteId,
          convocatoriaId: solicitud.convocatoriaId,
          documentosExigidos: [...solicitud.documentosExigidos],
          creadaEn: solicitud.creadaEn,
          ...datos,
        },
        update: datos,
      });

      await tx.documentoSolicitud.deleteMany({
        where: { solicitudId: solicitud.id, tipo: { notIn: documentos.map((d) => d.tipo) } },
      });
      for (const d of documentos) {
        const campos = {
          nombreArchivo: d.nombreArchivo,
          tipoContenido: d.tipoContenido,
          tamanoBytes: d.tamanoBytes,
          referencia: d.referencia,
          cargadoEn: d.cargadoEn,
        };
        await tx.documentoSolicitud.upsert({
          where: { solicitudId_tipo: { solicitudId: solicitud.id, tipo: d.tipo } },
          create: { solicitudId: solicitud.id, tipo: d.tipo, ...campos },
          update: campos,
        });
      }

      // El historial solo crece: las entradas ya guardadas se ignoran por su id.
      await tx.historialEstadoSolicitud.createMany({
        data: solicitud.listaHistorial().map((h) => ({ ...h, solicitudId: solicitud.id })),
        skipDuplicates: true,
      });
    });
  }
}

function aDominio(fila: FilaSolicitud): Solicitud {
  return Solicitud.reconstituir({
    id: fila.id,
    numero: fila.numero,
    estudianteId: fila.estudianteId,
    convocatoriaId: fila.convocatoriaId,
    estado: fila.estado as NombreEstado,
    documentosExigidos: fila.documentosExigidos,
    documentos: fila.documentos.map((d) => ({
      tipo: d.tipo,
      nombreArchivo: d.nombreArchivo,
      tipoContenido: d.tipoContenido,
      tamanoBytes: d.tamanoBytes,
      referencia: d.referencia,
      cargadoEn: d.cargadoEn,
    })),
    historial: fila.historial.map((h) => ({
      id: h.id,
      desde: h.desde as NombreEstado | null,
      hacia: h.hacia as NombreEstado,
      autorId: h.autorId,
      motivo: h.motivo,
      ocurridoEn: h.ocurridoEn,
    })),
    enviadaEn: fila.enviadaEn,
    creadaEn: fila.creadaEn,
  });
}
