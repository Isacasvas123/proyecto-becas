import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  DictamenDto,
  ExpedienteEvaluacionDto,
  SolicitudAsignadaDto,
} from '../../application/dto/evaluaciones.dto';
import { EvaluacionService } from '../../application/services/evaluacion.service';
import { EmitirDictamenRequestDto } from '../dto/evaluaciones-request.dto';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Roles, UsuarioActual } from '../../../usuarios/presentation/guards/decoradores';

const FORMATO_TIPO = /^[A-Z_]{2,40}$/;

/**
 * US-019 y US-020. Solo el EVALUADOR, y solo sobre lo que tiene asignado: el id sale del token y
 * el servicio comprueba la asignación antes de consultar nada.
 */
@Roles(RolUsuario.EVALUADOR)
@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(private readonly evaluacion: EvaluacionService) {}

  @Get('asignadas')
  asignadas(@UsuarioActual() evaluadorId: string): Promise<SolicitudAsignadaDto[]> {
    return this.evaluacion.asignadas(evaluadorId);
  }

  @Get('solicitudes/:id')
  expediente(
    @UsuarioActual() evaluadorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpedienteEvaluacionDto> {
    return this.evaluacion.expediente(evaluadorId, id);
  }

  @Get('solicitudes/:id/documentos/:tipo')
  async documento(
    @UsuarioActual() evaluadorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipo') tipo: string,
    @Res() respuesta: Response,
  ): Promise<void> {
    const archivo = FORMATO_TIPO.test(tipo)
      ? await this.evaluacion.documento(evaluadorId, id, tipo)
      : null;
    if (archivo === null) {
      throw new NotFoundException('Ese documento no está cargado');
    }
    respuesta
      .type(archivo.tipoContenido)
      .setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombreArchivo)}`,
      )
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(archivo.contenido);
  }

  @Post('solicitudes/:id/dictamen')
  @HttpCode(HttpStatus.CREATED)
  emitir(
    @UsuarioActual() evaluadorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() peticion: EmitirDictamenRequestDto,
  ): Promise<DictamenDto> {
    return this.evaluacion.emitir(evaluadorId, id, peticion);
  }
}
