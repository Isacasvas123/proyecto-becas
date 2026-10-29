import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import {
  FiltroSolicitudesReporte,
  mensajeSinCupo,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';

const CON_DETALLE = {
  documentos: true,
  historial: { orderBy: { ocurridoEn: 'asc' } },
  beca: true,
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

  async buscarPorConvocatoriaYEstado(
    convocatoriaId: string,
    estado: NombreEstado,
  ): Promise<Solicitud[]> {
    const filas = await this.prisma.solicitud.findMany({
      where: { convocatoriaId, estado },
      include: CON_DETALLE,
      orderBy: { enviadaEn: 'asc' },
    });
    return filas.map(aDominio);
  }

  async buscarPorIds(ids: readonly string[]): Promise<Solicitud[]> {
    if (ids.length === 0) return [];
    const filas = await this.prisma.solicitud.findMany({
      where: { id: { in: [...ids] } },
      include: CON_DETALLE,
    });
    return filas.map(aDominio);
  }

  /**
   * En una sola transacción: la solicitud, sus documentos y las entradas nuevas del historial.
   * Si algo falla no queda un documento guardado con la solicitud en el estado anterior.
   */
  async guardar(solicitud: Solicitud): Promise<void> {
    await this.prisma.$transaction((tx) => escribir(tx, solicitud));
  }

  /**
   * Bloquea la fila de la convocatoria (`FOR UPDATE`) antes de contar: una segunda aprobación
   * simultánea espera a que termine la primera y cuenta con su resultado. Sin el bloqueo, las dos
   * verían un cupo libre.
   */
  async guardarSiHayCupo(solicitud: Solicitud, cupos: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM convocatorias WHERE id = ${solicitud.convocatoriaId} FOR UPDATE`;
      const ocupados = await tx.solicitud.count({
        where: {
          convocatoriaId: solicitud.convocatoriaId,
          estado: { in: [NombreEstado.APROBADA, NombreEstado.ADJUDICADA] },
          id: { not: solicitud.id },
        },
      });
      if (ocupados >= cupos) {
        throw new ReglaDeNegocioError(mensajeSinCupo(cupos));
      }
      await escribir(tx, solicitud);
    });
  }

  async tieneBecaAdjudicada(estudianteId: string, exceptoSolicitudId: string): Promise<boolean> {
    const cuenta = await this.prisma.solicitud.count({
      where: {
        estudianteId,
        estado: NombreEstado.ADJUDICADA,
        id: { not: exceptoSolicitudId },
      },
    });
    return cuenta > 0;
  }

  async contarOcupacionDe(convocatoriaIds: readonly string[]) {
    const ocupacion = new Map<string, { aprobadas: number; adjudicadas: number }>();
    if (convocatoriaIds.length === 0) return ocupacion;

    const grupos = await this.prisma.solicitud.groupBy({
      by: ['convocatoriaId', 'estado'],
      where: {
        convocatoriaId: { in: [...convocatoriaIds] },
        estado: { in: [NombreEstado.APROBADA, NombreEstado.ADJUDICADA] },
      },
      _count: { _all: true },
    });

    // Toda convocatoria pedida aparece en el mapa, aunque no tenga ninguna solicitud: quien
    // pregunta espera una respuesta por cada una, no tener que distinguir ausencia de cero.
    for (const id of convocatoriaIds) ocupacion.set(id, { aprobadas: 0, adjudicadas: 0 });
    for (const g of grupos) {
      const fila = ocupacion.get(g.convocatoriaId)!;
      if (g.estado === NombreEstado.APROBADA) fila.aprobadas = g._count._all;
      else fila.adjudicadas = g._count._all;
    }

    return ocupacion;
  }

  async contarOcupacion(convocatoriaId: string) {
    const grupos = await this.prisma.solicitud.groupBy({
      by: ['estado'],
      where: { convocatoriaId, estado: { in: [NombreEstado.APROBADA, NombreEstado.ADJUDICADA] } },
      _count: { _all: true },
    });
    const de = (estado: NombreEstado) => grupos.find((g) => g.estado === estado)?._count._all ?? 0;
    return { aprobadas: de(NombreEstado.APROBADA), adjudicadas: de(NombreEstado.ADJUDICADA) };
  }

  async buscarPorNumero(numero: string): Promise<Solicitud | null> {
    const fila = await this.prisma.solicitud.findUnique({
      where: { numero },
      include: CON_DETALLE,
    });
    return fila === null ? null : aDominio(fila);
  }

  async paraReporte(f: FiltroSolicitudesReporte): Promise<Solicitud[]> {
    const estados = (f.estados ?? Object.values(NombreEstado)).filter(
      (e) => e !== NombreEstado.BORRADOR,
    );
    const filas = await this.prisma.solicitud.findMany({
      where: {
        convocatoriaId: f.convocatoriaId,
        estado: { in: estados },
        enviadaEn: { not: null, gte: f.enviadasDesde, lte: f.enviadasHasta },
      },
      include: CON_DETALLE,
      orderBy: { numero: 'asc' },
    });
    return filas.map(aDominio);
  }

  contarBecasConPrefijo(prefijo: string): Promise<number> {
    return this.prisma.beca.count({ where: { codigo: { startsWith: prefijo } } });
  }
}

/** Solicitud, documentos, historial nuevo y beca, dentro de la transacción que se reciba. */
async function escribir(tx: Prisma.TransactionClient, solicitud: Solicitud): Promise<void> {
  const documentos = solicitud.listaDocumentos();

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
      // Se copia al crear y no se vuelve a tocar: una convocatoria que cambie de monto no debe
      // alterar las reglas de las solicitudes que ya estaban en trámite (US-033).
      //
      // Faltaba. La solicitud nacía con el monto por defecto de la columna —cero— así que
      // `necesitaSegundaAprobacion()` era siempre falso y la doble aprobación NO ocurría en
      // ningún entorno real, por mucho que la convocatoria valiera Q15,000. Las pruebas no lo
      // vieron porque todas usan el repositorio en memoria, que guarda la entidad entera.
      montoBeca: solicitud.montoBeca,
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

  // US-024: la beca se crea una sola vez, en la misma transacción que el cambio de estado.
  const beca = solicitud.beca;
  if (beca !== null) {
    await tx.beca.upsert({
      where: { solicitudId: solicitud.id },
      create: { solicitudId: solicitud.id, codigo: beca.codigo, otorgadaEn: beca.otorgadaEn },
      update: {},
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
    montoBeca: fila.montoBeca,
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
    beca:
      fila.beca === null ? null : { codigo: fila.beca.codigo, otorgadaEn: fila.beca.otorgadaEn },
  });
}
