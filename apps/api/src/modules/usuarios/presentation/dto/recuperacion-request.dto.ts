/**
 * US-035, los dos pasos de la recuperación.
 *
 * Aquí solo se valida la forma de lo que llega: que sea una cadena, que parezca un correo,
 * que no venga vacío. Si la cuenta existe, si el enlace sirve todavía o si la contraseña
 * cumple la política son reglas de negocio y viven en el dominio.
 */
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SolicitarRecuperacionRequestDto {
  @IsString()
  @IsEmail({}, { message: 'Escriba un correo electrónico válido' })
  @MaxLength(254)
  correo!: string;
}

export class RestablecerPasswordRequestDto {
  /** El token en claro que viajó en el enlace del correo. 32 bytes en hexadecimal. */
  @IsString()
  @IsNotEmpty({ message: 'El enlace de recuperación es obligatorio' })
  @MaxLength(128)
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(72)
  password!: string;
}
