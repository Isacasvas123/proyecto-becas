/** Adaptadores entre `reportes` y los módulos de los que lee. Traducen, no deciden. */
import { Injectable } from '@nestjs/common';

import { ConsultarConvocatoriaService } from '../../../convocatorias/application/services/consultar-convocatoria.service';
import { PerfilEstudianteService } from '../../../estudiantes/application/services/perfil-estudiante.service';
import { SolicitudesParaReportesService } from '../../../solicitudes/application/services/solicitudes-para-reportes.service';
import {
  ConvocatoriaReportable,
  FuenteConvocatorias,
  FuentePerfiles,
  FuenteSolicitudes,
  PerfilReportable,
  SolicitudReportable,
} from '../../domain/ports/puertos';

@Injectable()
export class FuenteSolicitudesAdapter implements FuenteSolicitudes {
  constructor(private readonly solicitudes: SolicitudesParaReportesService) {}

  recibidas(filtro: {
    convocatoriaId?: string;
    estados?: readonly string[];
    desde?: Date;
    hasta?: Date;
  }): Promise<SolicitudReportable[]> {
    return this.solicitudes.filas(filtro);
  }
}

@Injectable()
export class FuentePerfilesAdapter implements FuentePerfiles {
  constructor(private readonly servicio: PerfilEstudianteService) {}

  perfiles(usuarioIds: readonly string[]): Promise<PerfilReportable[]> {
    return this.servicio.datosParaReportes(usuarioIds);
  }

  departamentos() {
    return this.servicio.departamentos();
  }
}

@Injectable()
export class FuenteConvocatoriasAdapter implements FuenteConvocatorias {
  constructor(private readonly convocatorias: ConsultarConvocatoriaService) {}

  todas(): Promise<ConvocatoriaReportable[]> {
    return this.convocatorias.resumenes();
  }
}
