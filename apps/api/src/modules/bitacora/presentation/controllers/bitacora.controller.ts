/**
 * Consulta de la bitácora, solo para ADMINISTRADOR: saber quién hizo qué sobre qué expediente ya
 * es información sensible. La consulta también se audita.
 */
import { Controller, Get, Query } from '@nestjs/common';

import { PaginaBitacoraDto } from '../../application/dto/bitacora.dto';
import { BitacoraService } from '../../application/services/bitacora.service';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Roles } from '../../../usuarios/presentation/guards/decoradores';
import { ConsultaBitacoraDto } from '../dto/consulta-bitacora.dto';

@Roles(RolUsuario.ADMINISTRADOR)
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Get()
  consultar(@Query() consulta: ConsultaBitacoraDto): Promise<PaginaBitacoraDto> {
    return this.bitacora.consultar({
      actorId: consulta.actorId,
      rol: consulta.rol,
      entidad: consulta.entidad,
      desde: consulta.desde === undefined ? undefined : new Date(`${consulta.desde}T00:00:00.000Z`),
      hasta: consulta.hasta === undefined ? undefined : new Date(`${consulta.hasta}T23:59:59.999Z`),
      soloRechazadas: consulta.soloRechazadas,
      pagina: consulta.pagina ?? 1,
      porPagina: consulta.porPagina ?? 50,
    });
  }

  /** Para llenar el desplegable de la pantalla sin inventar la lista en el frontend. */
  @Get('entidades')
  entidades(): Promise<string[]> {
    return this.bitacora.entidades();
  }
}
