import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

import {
  CuposDto,
  ResolucionFacade,
  ResultadoResolucionDto,
} from '../../application/facades/resolucion.facade';
import {
  ConsultaPublicaService,
  EstadoPublicoDto,
} from '../../application/services/consulta-publica.service';
import { Decision } from '../../domain/ports/consultas-externas';
import { LimiteConsultasGuard } from '../guards/limite-consultas.guard';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Publico, Roles, UsuarioActual } from '../../../usuarios/presentation/guards/decoradores';

export class ResolverRequestDto {
  @IsIn(['APROBAR', 'RECHAZAR'], { message: 'La decisión debe ser APROBAR o RECHAZAR' })
  decision!: Decision;

  @IsString()
  @MaxLength(2000)
  motivo!: string;
}

/** Segunda aprobacion (PO, 17 Oct 2026): solo el motivo; la decision ya se tomo. */
export class ConfirmarAprobacionRequestDto {
  @IsString()
  @MaxLength(2000)
  motivo!: string;
}

export class ConsultaPublicaRequestDto {
  @IsString()
  @Matches(/^\s*SOL-\d{4}-\d{6}\s*$/i, { message: 'El número tiene la forma SOL-2026-000123' })
  numero!: string;

  @IsString()
  @MaxLength(20)
  cui!: string;
}

/**
 * US-023 y US-024. Solo administración. El controlador llama a UN método de la fachada por
 * operación y no sabe cuántos colaboradores hay detrás: esa es la razón del patrón Facade.
 */
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('resoluciones')
export class ResolucionesController {
  constructor(private readonly fachada: ResolucionFacade) {}

  @Post('solicitudes/:id')
  @HttpCode(HttpStatus.OK)
  resolver(
    @UsuarioActual() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() peticion: ResolverRequestDto,
  ): Promise<ResultadoResolucionDto> {
    return this.fachada.resolver(id, peticion.decision, peticion.motivo, adminId);
  }

  /** PO, 17 Oct 2026. La da una persona distinta de la que aprobo primero (lo exige el dominio). */
  @Post('solicitudes/:id/confirmar-aprobacion')
  @HttpCode(HttpStatus.OK)
  confirmarAprobacion(
    @UsuarioActual() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() peticion: ConfirmarAprobacionRequestDto,
  ): Promise<ResultadoResolucionDto> {
    return this.fachada.confirmarAprobacion(id, peticion.motivo, adminId);
  }

  @Post('solicitudes/:id/adjudicar')
  @HttpCode(HttpStatus.OK)
  adjudicar(
    @UsuarioActual() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResultadoResolucionDto> {
    return this.fachada.adjudicar(id, adminId);
  }

  @Get('convocatorias/:id/cupos')
  cupos(@Param('id', ParseUUIDPipe) id: string): Promise<CuposDto> {
    return this.fachada.cupos(id);
  }
}

/**
 * US-025. Pública a propósito, como el listado de convocatorias: es el requisito de
 * transparencia del enunciado.
 *
 * POST y no GET: el CUI es un dato personal y en una URL quedaría en el historial del navegador y
 * en los registros de cualquier servidor intermedio. En el cuerpo, no.
 */
@Publico()
@Controller('consulta-publica')
export class ConsultaPublicaController {
  constructor(private readonly consulta: ConsultaPublicaService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LimiteConsultasGuard)
  consultar(@Body() peticion: ConsultaPublicaRequestDto): Promise<EstadoPublicoDto> {
    return this.consulta.consultar(peticion.numero, peticion.cui);
  }
}
