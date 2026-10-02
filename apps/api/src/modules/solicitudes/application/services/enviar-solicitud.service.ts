/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-014 — Enviar solicitud. Flujo de CU-08.
 *
 * CRITERIO 2: "SI FALTA ALGO, EL SISTEMA INDICA EXACTAMENTE QUÉ FALTA"
 *   Se revisa todo antes de intentar la transición y se responde con UNA lista: los datos del
 *   perfil y los documentos, con su nombre legible. La persona corrige todo de una vez, en lugar de
 *   descubrir los faltantes uno por uno a base de intentos.
 *
 *   La transición a ENVIADA vuelve a comprobar los documentos por su cuenta (el estado BORRADOR no
 *   confía en que alguien lo haya hecho antes): esta comprobación es para dar un buen mensaje, la
 *   del estado es la garantía.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import {
  CONSULTA_CONVOCATORIAS,
  CONSULTA_PERFILES,
  ConsultaConvocatorias,
  ConsultaPerfiles,
} from '../../domain/ports/consultas-externas';
import {
  NOTIFICADOR_SOLICITUDES,
  NotificadorSolicitudes,
} from '../../domain/ports/notificador-solicitudes';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { SolicitudDto } from '../dto/solicitud.dto';
import { aSolicitudDto } from '../mappers/solicitud.mapper';
import { ExpedienteService } from './expediente.service';

@Injectable()
export class EnviarSolicitudService {
  private readonly logger = new Logger(EnviarSolicitudService.name);

  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    @Inject(CONSULTA_CONVOCATORIAS)
    private readonly convocatorias: ConsultaConvocatorias,
    @Inject(CONSULTA_PERFILES)
    private readonly perfiles: ConsultaPerfiles,
    @Inject(NOTIFICADOR_SOLICITUDES)
    private readonly notificador: NotificadorSolicitudes,
    private readonly expediente: ExpedienteService,
  ) {}

  async ejecutar(
    estudianteId: string,
    solicitudId: string,
    ahora: Date = new Date(),
  ): Promise<SolicitudDto> {
    const solicitud = await this.expediente.cargarPropia(estudianteId, solicitudId);
    const convocatoria = await this.convocatorias.buscar(solicitud.convocatoriaId);

    // Solo se revisan faltantes si la solicitud sigue en borrador. Si ya se envió, el estado se
    // encarga de responder con la transición inválida (409), que es el mensaje correcto.
    if (solicitud.esEditable()) {
      if (convocatoria !== null && !convocatoria.admiteSolicitudes) {
        throw new ReglaDeNegocioError(
          'La convocatoria ya no está recibiendo postulaciones: el plazo cerró el ' +
            `${convocatoria.fechaCierre.toISOString().slice(0, 10)}.`,
        );
      }

      const perfil = await this.perfiles.estado(estudianteId);
      const documentos = aSolicitudDto(solicitud, convocatoria).documentosFaltantes;
      const faltas = [
        perfil.completo ? null : `datos del perfil (${perfil.camposFaltantes.join(', ')})`,
        documentos.length === 0 ? null : `documentos (${documentos.join('; ')})`,
      ].filter((f): f is string => f !== null);

      if (faltas.length > 0) {
        throw new ReglaDeNegocioError(`No se puede enviar todavía. Falta: ${faltas.join(' y ')}.`);
      }
    }

    solicitud.enviar(ahora, estudianteId);
    await this.repositorio.guardar(solicitud);
    this.logger.log(`Solicitud enviada: ${solicitud.numero}`);

    // Criterio 4. Si el aviso falla, la solicitud YA está enviada y guardada: no se deshace ni se
    // le devuelve un error al estudiante por un problema del canal de avisos.
    await this.notificador
      .solicitudEnviada({
        estudianteId,
        numero: solicitud.numero,
        convocatoria: convocatoria?.titulo ?? solicitud.convocatoriaId,
        enviadaEn: ahora,
      })
      .catch((error: unknown) => {
        this.logger.error(`No se pudo notificar el envío de ${solicitud.numero}: ${String(error)}`);
      });

    return aSolicitudDto(solicitud, convocatoria);
  }
}
