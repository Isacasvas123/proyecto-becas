/**
 * Escribir y consultar la bitácora.
 *
 * Escribir nunca rompe la petición: si la bitácora falla, la acción del usuario ya ocurrió y se
 * le devolvería un error por algo que no hizo. El fallo va al log y la petición sigue. Abortar
 * por no poder auditar haría de la bitácora un punto único de caída.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { RegistroBitacora } from '../../domain/entities/registro-bitacora.entity';
import {
  BITACORA_REPOSITORIO,
  BitacoraRepositorio,
  FiltroBitacora,
} from '../../domain/ports/bitacora.repositorio';
import { PaginaBitacoraDto, RegistroBitacoraDto } from '../dto/bitacora.dto';

/** Tope de tamaño de página: una consulta sin límite puede traerse la bitácora entera. */
const POR_PAGINA_MAXIMO = 100;

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(
    @Inject(BITACORA_REPOSITORIO)
    private readonly repositorio: BitacoraRepositorio,
  ) {}

  async registrar(registro: RegistroBitacora): Promise<void> {
    try {
      await this.repositorio.registrar(registro);
    } catch (causa: unknown) {
      const motivo = causa instanceof Error ? causa.message : String(causa);
      this.logger.error(`No se pudo escribir en la bitácora (${registro.accion}): ${motivo}`);
    }
  }

  async consultar(filtro: FiltroBitacora): Promise<PaginaBitacoraDto> {
    const porPagina = Math.min(Math.max(filtro.porPagina, 1), POR_PAGINA_MAXIMO);
    const pagina = Math.max(filtro.pagina, 1);

    const { registros, total } = await this.repositorio.consultar({
      ...filtro,
      pagina,
      porPagina,
    });

    return {
      registros: registros.map(aDto),
      total,
      pagina,
      porPagina,
      paginas: Math.max(Math.ceil(total / porPagina), 1),
    };
  }

  entidades(): Promise<string[]> {
    return this.repositorio.entidades();
  }
}

function aDto(registro: RegistroBitacora): RegistroBitacoraDto {
  return {
    actor: registro.actor.nombreUsuario,
    rol: registro.actor.rol,
    accion: registro.accion,
    entidad: registro.entidad,
    entidadId: registro.entidadId,
    resultado: registro.resultado,
    rechazada: registro.fueRechazada,
    origen: registro.origen,
    ocurridoEn: registro.ocurridoEn.toISOString(),
  };
}
