import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import {
  ComiteDto,
  ConsolidadoDto,
  ResultadoAsignacionDto,
  SolicitudPorAsignarDto,
} from '../../application/dto/evaluaciones.dto';
import { ComandoAsignar, ComitesService } from '../../application/services/comites.service';
import { ConsolidadoService } from '../../application/services/consolidado.service';
import {
  AgregarEvaluadoresRequestDto,
  AsignarRequestDto,
  CrearComiteRequestDto,
} from '../dto/evaluaciones-request.dto';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Roles, UsuarioActual } from '../../../usuarios/presentation/guards/decoradores';

/**
 * US-017, US-018 y US-021. Solo administración: definir un comité es definir quién puede ver los
 * datos personales de los aspirantes (nota de CU-13).
 */
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('comites')
export class ComitesController {
  constructor(
    private readonly comites: ComitesService,
    private readonly consolidado: ConsolidadoService,
  ) {}

  @Get()
  listar(): Promise<ComiteDto[]> {
    return this.comites.listar();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(
    @UsuarioActual() adminId: string,
    @Body() peticion: CrearComiteRequestDto,
  ): Promise<ComiteDto> {
    return this.comites.crear(peticion, adminId);
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string): Promise<ComiteDto> {
    return this.comites.detalle(id);
  }

  @Post(':id/evaluadores')
  @HttpCode(HttpStatus.OK)
  agregar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() peticion: AgregarEvaluadoresRequestDto,
  ): Promise<ComiteDto> {
    return this.comites.agregarEvaluadores(id, peticion.evaluadorIds);
  }

  /**
   * CU-13, flujo 5a. Sin `confirmar=true` la petición se rechaza cuando el evaluador tiene
   * solicitudes pendientes, y el mensaje dice cuántas quedarían sin evaluador. Es la confirmación
   * explícita que pide el flujo, exigida por la API y no solo por la pantalla.
   */
  @Delete(':id/evaluadores/:evaluadorId')
  @HttpCode(HttpStatus.OK)
  quitar(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evaluadorId', ParseUUIDPipe) evaluadorId: string,
    @Query('confirmar', new ParseBoolPipe({ optional: true })) confirmar?: boolean,
  ): Promise<ComiteDto> {
    return this.comites.quitarEvaluador(id, evaluadorId, confirmar === true);
  }

  @Get(':id/por-asignar')
  porAsignar(@Param('id', ParseUUIDPipe) id: string): Promise<SolicitudPorAsignarDto[]> {
    return this.comites.porAsignar(id);
  }

  /** US-018. Manual (una lista) o automático (reparto equitativo). */
  @Post(':id/asignaciones')
  @HttpCode(HttpStatus.OK)
  asignar(
    @UsuarioActual() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() peticion: AsignarRequestDto,
  ): Promise<ResultadoAsignacionDto> {
    const comando: ComandoAsignar =
      peticion.modo === 'AUTOMATICO'
        ? { modo: 'AUTOMATICO', porSolicitud: peticion.porSolicitud ?? 1 }
        : { modo: 'MANUAL', asignaciones: peticion.asignaciones ?? [] };
    return this.comites.asignar(id, comando, adminId);
  }

  /** US-021. */
  @Get(':id/consolidado')
  consolidar(@Param('id', ParseUUIDPipe) id: string): Promise<ConsolidadoDto> {
    return this.consolidado.deComite(id);
  }
}
