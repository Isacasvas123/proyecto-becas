/**
 * Contrato de entrada de `POST /convocatorias` (US-006).
 *
 * Aquí se valida la forma: que los campos existan, tengan el tipo correcto y valores del
 * catálogo. Las reglas de negocio (cierre posterior a apertura, cupos positivos, el tope de
 * posgrado) viven en el dominio y no se repiten, porque tendrían dos definiciones que tarde o
 * temprano dirían cosas distintas. `@Min(1)` en cupos es la excepción: rechaza basura obvia antes
 * de llegar al dominio, que de todos modos vuelve a comprobarlo.
 */
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';

export class CrearConvocatoriaRequestDto {
  @IsEnum(TipoBeca, { message: 'El tipo debe ser NIVEL_MEDIO, UNIVERSITARIA o POSGRADO' })
  tipo!: TipoBeca;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150)
  titulo!: string;

  @IsString()
  @MaxLength(2000)
  descripcion!: string;

  @IsInt({ message: 'Los cupos deben ser un número entero' })
  @Min(1, { message: 'Los cupos deben ser al menos 1' })
  cupos!: number;

  /**
   * Monto de la beca en quetzales enteros (PO, 17 Oct 2026). Por encima de Q10,000, cada
   * solicitud de esta convocatoria necesitara dos aprobaciones.
   */
  @IsInt({ message: 'El monto debe ser un número entero de quetzales' })
  @Min(1, { message: 'El monto debe ser al menos Q1' })
  montoBeca!: number;

  @Type(() => Date)
  @IsDate({ message: 'La fecha de apertura no es una fecha válida' })
  fechaApertura!: Date;

  @Type(() => Date)
  @IsDate({ message: 'La fecha de cierre no es una fecha válida' })
  fechaCierre!: Date;

  /** Opcional: si no se envía, se usan los del tipo de beca (US-006, criterio 1). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Requisito, { each: true, message: 'Hay un requisito que no está en el catálogo' })
  requisitos?: Requisito[];

  /** Opcional: si no se envía, se usan los del tipo de beca (US-006, criterio 1). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(TipoDocumento, { each: true, message: 'Hay un documento que no está en el catálogo' })
  documentosExigidos?: TipoDocumento[];
}
