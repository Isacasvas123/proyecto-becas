/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Listado de TODAS las convocatorias, en cualquier estado, para el panel de administración.
 *
 * Por qué es un caso de uso distinto de `ListarConvocatoriasPublicadas` y no un parámetro
 * `?todas=true` en el mismo: responden a actores distintos con reglas opuestas. El público
 * NUNCA debe ver un borrador; el administrador necesita verlos. Un parámetro que cambia esa
 * regla es exactamente el tipo de interruptor que un día alguien deja abierto por error.
 */
import { Inject, Injectable } from '@nestjs/common';

import {
  CONVOCATORIA_REPOSITORIO,
  ConvocatoriaRepositorio,
} from '../../domain/ports/convocatoria.repositorio';
import { ConvocatoriaListadaDto } from '../dto/convocatoria-listada.dto';
import { aConvocatoriaListadaDto } from '../mappers/convocatoria.mapper';

@Injectable()
export class ListarConvocatoriasGestionService {
  constructor(
    @Inject(CONVOCATORIA_REPOSITORIO)
    private readonly repositorio: ConvocatoriaRepositorio,
  ) {}

  async ejecutar(): Promise<ConvocatoriaListadaDto[]> {
    const convocatorias = await this.repositorio.buscarTodas();
    return convocatorias.map(aConvocatoriaListadaDto);
  }
}
