/** Contratos de entrada de `evaluaciones`. Aquí se valida la forma; las reglas, en el dominio. */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { Recomendacion } from '../../domain/enums/recomendacion.enum';

export class CrearComiteRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El comité necesita un nombre' })
  @MaxLength(120)
  nombre!: string;

  @IsUUID('4', { message: 'La convocatoria indicada no es válida' })
  convocatoriaId!: string;

  // Vacío se admite aquí para que el dominio responda con el mensaje de CU-13 (4a / 6a).
  @IsUUID('4', { each: true, message: 'Hay un evaluador con un identificador no válido' })
  @ArrayMaxSize(50)
  evaluadorIds!: string[];
}

export class AgregarEvaluadoresRequestDto {
  @IsUUID('4', { each: true, message: 'Hay un evaluador con un identificador no válido' })
  @ArrayMinSize(1, { message: 'Elija al menos un evaluador' })
  @ArrayMaxSize(50)
  evaluadorIds!: string[];
}

export class AsignacionManualDto {
  @IsUUID('4')
  solicitudId!: string;

  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Cada solicitud debe asignarse al menos a un evaluador' })
  @ArrayMaxSize(10)
  evaluadorIds!: string[];
}

export class AsignarRequestDto {
  @IsIn(['AUTOMATICO', 'MANUAL'], { message: 'El modo debe ser AUTOMATICO o MANUAL' })
  modo!: 'AUTOMATICO' | 'MANUAL';

  @ValidateIf((o: AsignarRequestDto) => o.modo === 'AUTOMATICO')
  @IsInt({ message: 'Indique cuántos evaluadores por solicitud' })
  @Min(1)
  @Max(10)
  porSolicitud?: number;

  @ValidateIf((o: AsignarRequestDto) => o.modo === 'MANUAL')
  @ValidateNested({ each: true })
  @Type(() => AsignacionManualDto)
  @ArrayMinSize(1, { message: 'No hay asignaciones' })
  @ArrayMaxSize(500)
  asignaciones?: AsignacionManualDto[];
}

export class EmitirDictamenRequestDto {
  @IsEnum(Recomendacion, { message: 'La recomendación debe ser FAVORABLE o DESFAVORABLE' })
  recomendacion!: Recomendacion;

  @IsString()
  @MaxLength(2000)
  observacion!: string;
}
