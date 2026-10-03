/** Adaptadores entre `resoluciones` y los módulos que coordina. Traducen, no deciden. */
import { Injectable, Logger } from '@nestjs/common';

import { ConsultarConvocatoriaService } from '../../../convocatorias/application/services/consultar-convocatoria.service';
import { DictamenesDeSolicitudService } from '../../../evaluaciones/application/services/dictamenes-de-solicitud.service';
import { SolicitudesParaResolucionService } from '../../../solicitudes/application/services/solicitudes-para-resolucion.service';
import { IdentidadService } from '../../../usuarios/application/services/identidad.service';
import {
  ConsultaConvocatoriasResolucion,
  ConsultaDictamenes,
  ConsultaIdentidad,
  ConsultaSolicitudesResolucion,
  ConvocatoriaResoluble,
  Decision,
} from '../../domain/ports/consultas-externas';
import {
  AvisoResolucion,
  NotificadorResoluciones,
} from '../../domain/ports/notificador-resoluciones';

@Injectable()
export class ConsultaSolicitudesResolucionAdapter implements ConsultaSolicitudesResolucion {
  constructor(private readonly solicitudes: SolicitudesParaResolucionService) {}

  buscar(id: string) {
    return this.solicitudes.resumen(id);
  }

  buscarPorNumero(numero: string) {
    return this.solicitudes.porNumero(numero);
  }

  resolver(id: string, decision: Decision, motivo: string, autorId: string, cupos: number) {
    return this.solicitudes.resolver(id, decision, motivo, autorId, cupos);
  }

  adjudicar(id: string, autorId: string) {
    return this.solicitudes.adjudicar(id, autorId);
  }

  ocupacion(convocatoriaId: string) {
    return this.solicitudes.ocupacion(convocatoriaId);
  }
}

@Injectable()
export class ConsultaDictamenesAdapter implements ConsultaDictamenes {
  constructor(private readonly dictamenes: DictamenesDeSolicitudService) {}

  resumen(solicitudId: string) {
    return this.dictamenes.resumen(solicitudId);
  }
}

@Injectable()
export class ConsultaConvocatoriasResolucionAdapter implements ConsultaConvocatoriasResolucion {
  constructor(private readonly convocatorias: ConsultarConvocatoriaService) {}

  async buscar(id: string): Promise<ConvocatoriaResoluble | null> {
    const c = await this.convocatorias.paraPostulacion(id);
    return c === null ? null : { id: c.id, codigo: c.codigo, titulo: c.titulo, cupos: c.cupos };
  }
}

@Injectable()
export class ConsultaIdentidadAdapter implements ConsultaIdentidad {
  constructor(private readonly identidad: IdentidadService) {}

  cuiCoincide(usuarioId: string, cui: string): Promise<boolean> {
    return this.identidad.cuiCoincide(usuarioId, cui);
  }
}

/** `NOTIFICACIONES_TIPO=consola`. El correo es US-022. */
@Injectable()
export class NotificadorResolucionesConsolaAdapter implements NotificadorResoluciones {
  private readonly logger = new Logger('Notificaciones');

  cambioDeEstado(aviso: AvisoResolucion): Promise<void> {
    const extra = [
      aviso.motivo !== null ? `Motivo: ${aviso.motivo}` : null,
      aviso.codigoBeca !== null ? `Beca: ${aviso.codigoBeca}` : null,
    ].filter(Boolean);
    this.logger.log(
      `Para el estudiante ${aviso.estudianteId}: su solicitud ${aviso.numero} pasó a ${aviso.estado}.` +
        (extra.length > 0 ? ` ${extra.join(' · ')}` : ''),
    );
    return Promise.resolve();
  }
}
