/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-012 — Crear solicitud. Sigue el flujo de CU-06 (docs/diagramas/01-casos-de-uso.md):
 *
 *   1. La convocatoria existe y admite postulaciones ...... criterio 1 · flujo de excepción 1a
 *   2. El perfil del estudiante está completo ............. precondición de CU-06 · flujo 2a
 *   3. No hay otra solicitud activa a esa convocatoria ...... criterio 2 · flujo 3a
 *   4. Nace en BORRADOR con número correlativo ............. criterio 3 (patrón State)
 *   5. Muestra los documentos que faltan .................... criterio 4
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import {
  CONSULTA_CONVOCATORIAS,
  CONSULTA_PERFILES,
  ConsultaConvocatorias,
  ConsultaPerfiles,
} from '../../domain/ports/consultas-externas';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { SolicitudDto } from '../dto/solicitud.dto';
import { ExpedienteService } from './expediente.service';

@Injectable()
export class CrearSolicitudService {
  private readonly logger = new Logger(CrearSolicitudService.name);

  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    @Inject(CONSULTA_CONVOCATORIAS)
    private readonly convocatorias: ConsultaConvocatorias,
    @Inject(CONSULTA_PERFILES)
    private readonly perfiles: ConsultaPerfiles,
    private readonly expediente: ExpedienteService,
  ) {}

  async ejecutar(
    estudianteId: string,
    convocatoriaId: string,
    ahora: Date = new Date(),
  ): Promise<SolicitudDto> {
    const convocatoria = await this.convocatorias.buscar(convocatoriaId);
    if (convocatoria === null) {
      throw new RecursoNoEncontradoError('No existe esa convocatoria.');
    }
    if (!convocatoria.admiteSolicitudes) {
      throw new ReglaDeNegocioError(
        `La convocatoria ${convocatoria.codigo} no está recibiendo postulaciones ` +
          `(cierra o cerró el ${convocatoria.fechaCierre.toISOString().slice(0, 10)}).`,
      );
    }

    const perfil = await this.perfiles.estado(estudianteId);
    if (!perfil.completo) {
      throw new ReglaDeNegocioError(
        `Complete su perfil antes de postular. Falta: ${perfil.camposFaltantes.join(', ')}.`,
      );
    }

    const existente = await this.repositorio.buscarActiva(estudianteId, convocatoriaId);
    if (existente !== null) {
      throw new RecursoDuplicadoError(
        `Ya tiene una solicitud activa para esta convocatoria: ${existente.numero}.`,
      );
    }

    // SOL-2026-000001. Correlativo por año de creación. Misma limitación aceptada que el código
    // de convocatorias: dos creaciones simultáneas chocarían contra el índice único del número, y
    // la segunda recibiría un error en vez de un número duplicado.
    const prefijo = `SOL-${ahora.getUTCFullYear()}-`;
    const correlativo = (await this.repositorio.contarConPrefijoDeNumero(prefijo)) + 1;

    const solicitud = Solicitud.nueva({
      id: randomUUID(),
      numero: `${prefijo}${String(correlativo).padStart(6, '0')}`,
      estudianteId,
      convocatoriaId,
      documentosExigidos: convocatoria.documentosExigidos.map((d) => d.codigo),
      ahora,
    });

    await this.repositorio.guardar(solicitud);
    this.logger.log(`Solicitud creada: ${solicitud.numero}`);

    return this.expediente.presentar(solicitud);
  }
}
