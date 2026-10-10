/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que `solicitudes` le ofrece al módulo `evaluaciones` (EPIC-04). Es la única puerta.
 *
 * QUIÉN PUEDE VER QUÉ NO SE DECIDE AQUÍ
 *   Estos métodos no reciben al usuario: no comprueban propiedad. Quien los usa —`evaluaciones`—
 *   debe haber verificado antes que el evaluador tiene la solicitud asignada (CU-10, 1a). Por eso
 *   este servicio NO lo usa ningún controlador de `solicitudes`: solo se exporta.
 *
 * POR QUÉ `solicitudes` NO CONOCE A `evaluaciones`
 *   La dependencia va en un solo sentido: evaluaciones → solicitudes. Si fuera en los dos, Nest
 *   necesitaría `forwardRef` y los módulos dejarían de poder entenderse por separado.
 */
import { Inject, Injectable } from '@nestjs/common';

import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import {
  ALMACENAMIENTO_DOCUMENTOS,
  AlmacenamientoDocumentos,
} from '../../domain/ports/almacenamiento-documentos';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { SolicitudDto } from '../dto/solicitud.dto';
import { ArchivoDescargable, leerDocumento } from './cargar-documento.service';
import { ExpedienteService } from './expediente.service';

export interface ResumenSolicitudDto {
  readonly id: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudianteId: string;
  readonly convocatoriaId: string;
  readonly enviadaEn: string | null;
}

@Injectable()
export class SolicitudesParaEvaluacionService {
  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    @Inject(ALMACENAMIENTO_DOCUMENTOS)
    private readonly almacenamiento: AlmacenamientoDocumentos,
    private readonly expedientes: ExpedienteService,
  ) {}

  /** US-018, criterio 1: solo las ENVIADAS se pueden asignar. */
  async enviadasDe(convocatoriaId: string): Promise<ResumenSolicitudDto[]> {
    const solicitudes = await this.repositorio.buscarPorConvocatoriaYEstado(
      convocatoriaId,
      NombreEstado.ENVIADA,
    );
    return solicitudes.map(aResumen);
  }

  /**
   * CU-13, flujo 5a. Quitar a un evaluador puede dejar solicitudes EN_EVALUACION sin nadie que
   * las evalúe, y hay que poder reasignarlas. No se las devuelve a ENVIADA: el ciclo de vida solo
   * avanza (patrón State), así que es el comité quien las vuelve a repartir en el estado en el
   * que están.
   */
  async enEvaluacionDe(convocatoriaId: string): Promise<ResumenSolicitudDto[]> {
    const solicitudes = await this.repositorio.buscarPorConvocatoriaYEstado(
      convocatoriaId,
      NombreEstado.EN_EVALUACION,
    );
    return solicitudes.map(aResumen);
  }

  async resumenes(ids: readonly string[]): Promise<ResumenSolicitudDto[]> {
    return (await this.repositorio.buscarPorIds(ids)).map(aResumen);
  }

  /**
   * US-018, criterio 3: pasan a EN_EVALUACION. Se validan TODAS antes de cambiar ninguna: si una
   * no está ENVIADA o no es de la convocatoria, no se toca nada y el mensaje dice cuáles.
   */
  async iniciarEvaluacion(
    ids: readonly string[],
    convocatoriaId: string,
    autorId: string,
    ahora: Date = new Date(),
  ): Promise<void> {
    const solicitudes = await this.repositorio.buscarPorIds(ids);
    const encontradas = new Set(solicitudes.map((s) => s.id));
    const inexistentes = ids.filter((id) => !encontradas.has(id));
    const invalidas = solicitudes.filter(
      (s) => s.convocatoriaId !== convocatoriaId || s.nombreEstado !== NombreEstado.ENVIADA,
    );

    if (inexistentes.length > 0 || invalidas.length > 0) {
      const partes = [
        ...invalidas.map((s) => `${s.numero} (${s.nombreEstado})`),
        ...(inexistentes.length > 0 ? [`${inexistentes.length} inexistente(s)`] : []),
      ];
      throw new ReglaDeNegocioError(
        `Solo se asignan solicitudes ENVIADAS de esta convocatoria. No se puede: ${partes.join(', ')}.`,
      );
    }

    for (const solicitud of solicitudes) {
      solicitud.iniciarEvaluacion(ahora, autorId);
      await this.repositorio.guardar(solicitud);
    }
  }

  async expediente(
    id: string,
  ): Promise<{ resumen: ResumenSolicitudDto; detalle: SolicitudDto } | null> {
    const solicitud = await this.repositorio.buscarPorId(id);
    if (solicitud === null) return null;
    return { resumen: aResumen(solicitud), detalle: await this.expedientes.presentar(solicitud) };
  }

  async documento(id: string, tipo: string): Promise<ArchivoDescargable | null> {
    const solicitud = await this.repositorio.buscarPorId(id);
    return solicitud === null ? null : leerDocumento(this.almacenamiento, solicitud, tipo);
  }
}

function aResumen(s: {
  id: string;
  numero: string;
  nombreEstado: string;
  estudianteId: string;
  convocatoriaId: string;
  enviadaEn: Date | null;
}): ResumenSolicitudDto {
  return {
    id: s.id,
    numero: s.numero,
    estado: s.nombreEstado,
    estudianteId: s.estudianteId,
    convocatoriaId: s.convocatoriaId,
    enviadaEn: s.enviadaEn?.toISOString() ?? null,
  };
}
