/**
 * Listado de todas las convocatorias, en cualquier estado, para el panel de administración.
 *
 * Es un caso de uso aparte de `ListarConvocatoriasPublicadas` y no un parámetro `?todas=true`
 * porque responden a actores distintos con reglas opuestas: el público nunca debe ver un
 * borrador y el administrador necesita verlos. Un parámetro que cambia esa regla es un
 * interruptor que alguien puede dejar abierto por error.
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
