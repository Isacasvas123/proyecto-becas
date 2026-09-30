/**
 * CAPA: presentation/dto/
 * ────────────────────────────────────────────────────────────────────────────────
 * Contrato de ENTRADA de `POST /convocatorias` (US-006).
 *
 * QUÉ SE VALIDA AQUÍ Y QUÉ NO
 *   Aquí se valida la FORMA: que los campos existan, tengan el tipo correcto y valores del
 *   catálogo. Eso le toca a la frontera HTTP.
 *
 *   Las REGLAS DE NEGOCIO —cierre posterior a apertura, cupos enteros positivos, el tope de
 *   posgrado— NO se repiten aquí. Viven en el dominio y se comprueban allí. Si también
 *   estuvieran aquí, habría dos definiciones de la misma regla y tarde o temprano dirían
 *   cosas distintas. `@Min(1)` en cupos es la excepción consciente: rechaza basura obvia
 *   antes de llegar al dominio, que de todas formas vuelve a comprobarlo.
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
