/**
 * CAPA: presentation/controllers/
 * ────────────────────────────────────────────────────────────────────────────────
 * Consulta de la bitácora. **Solo ADMINISTRADOR**: saber quién hizo qué sobre qué expediente es,
 * en sí mismo, información sensible.
 *
 * Y la consulta también se audita (`RUTAS_SENSIBLES` del interceptor): quién revisa la bitácora
 * queda registrado en la bitácora.
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
