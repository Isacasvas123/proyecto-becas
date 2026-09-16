/**
 * Contrato de entrada de `PUT /estudiantes/perfil` (US-011).
 *
 * Todos los campos admiten `null`: el perfil se puede guardar a medias. Lo que NO se admite es
 * un campo ausente, para que "no lo mandé" y "lo quiero vacío" no se confundan: el cliente manda
 * siempre el perfil entero.
 */
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { Departamento, NivelAcademico } from '../../domain/enums/catalogos';

const siNoEsNulo = (_: unknown, valor: unknown) => valor !== null;

export class PerfilRequestDto {
  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsString()
  @MaxLength(150)
  centroEducativo!: string | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsEnum(NivelAcademico, { message: 'El nivel académico no es válido' })
  nivel!: NivelAcademico | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El promedio debe ser un número' })
  @Min(0, { message: 'El promedio debe estar entre 0 y 100' })
  @Max(100, { message: 'El promedio debe estar entre 0 y 100' })
  promedio!: number | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsInt({ message: 'El ingreso familiar debe ser un número entero de quetzales' })
  @Min(0)
  @Max(10_000_000)
  ingresoFamiliarMensual!: number | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsInt()
  @Min(0)
  @Max(50)
  dependientes!: number | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsEnum(Departamento, { message: 'El departamento no es válido' })
  departamento!: Departamento | null;

  @IsDefined()
  @ValidateIf(siNoEsNulo)
  @IsString()
  @MaxLength(80)
  municipio!: string | null;
}
