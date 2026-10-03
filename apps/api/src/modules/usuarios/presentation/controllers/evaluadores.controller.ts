import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import {
  CuentasEvaluadorService,
  ResumenCuentaDto,
} from '../../application/services/cuentas-evaluador.service';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { RegistroRequestDto } from '../dto/registro-request.dto';
import { Roles } from '../guards/decoradores';

/**
 * US-017 — cuentas de evaluador. Solo administración.
 *
 * El cuerpo es el mismo contrato del registro público (mismos campos, mismas validaciones):
 * tampoco acepta `rol`. El rol lo pone el caso de uso.
 */
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('evaluadores')
export class EvaluadoresController {
  constructor(private readonly cuentas: CuentasEvaluadorService) {}

  @Get()
  listar(): Promise<ResumenCuentaDto[]> {
    return this.cuentas.listar();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() peticion: RegistroRequestDto): Promise<ResumenCuentaDto> {
    return this.cuentas.crear(peticion);
  }
}
