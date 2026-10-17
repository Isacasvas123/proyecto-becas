/** Contrato de entrada de `GET /bitacora`. Todos los filtros son opcionales. */
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';

export class ConsultaBitacoraDto {
  @IsOptional()
  @IsUUID('4', { message: 'El usuario indicado no es válido' })
  actorId?: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'Ese rol no existe' })
  rol?: RolUsuario;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  entidad?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'La fecha "desde" debe ser AAAA-MM-DD' })
  desde?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'La fecha "hasta" debe ser AAAA-MM-DD' })
  hasta?: string;

  // En la URL llega como texto; `true` solo si se pide explícitamente.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloRechazadas?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porPagina?: number;
}
