import { Injectable } from '@nestjs/common';

import { ConsultarConvocatoriaService } from '../../../convocatorias/application/services/consultar-convocatoria.service';
import { PerfilEstudianteService } from '../../../estudiantes/application/services/perfil-estudiante.service';
import {
  ConsultaConvocatorias,
  ConsultaPerfiles,
  ConvocatoriaDeSolicitud,
} from '../../domain/ports/consultas-externas';

/** Traduce el servicio de `convocatorias` al vocabulario de `solicitudes`. */
@Injectable()
export class ConsultaConvocatoriasAdapter implements ConsultaConvocatorias {
  constructor(private readonly convocatorias: ConsultarConvocatoriaService) {}

  buscar(convocatoriaId: string): Promise<ConvocatoriaDeSolicitud | null> {
    return this.convocatorias.paraPostulacion(convocatoriaId);
  }
}

@Injectable()
export class ConsultaPerfilesAdapter implements ConsultaPerfiles {
  constructor(private readonly perfiles: PerfilEstudianteService) {}

  estado(estudianteId: string) {
    return this.perfiles.estadoDePerfil(estudianteId);
  }
}
