/**
 * Contrato de entrada de `POST /auth/registro` (US-001). Valida la forma; el formato del CUI y la
 * política de contraseña son reglas del dominio y se comprueban allí.
 *
 * No tiene `rol` ni `activo`: con `forbidNonWhitelisted` en `main.ts`, una petición que mande
 * `"rol": "ADMINISTRADOR"` se rechaza con 400, y `Usuario.nuevoEstudiante` tampoco acepta rol.
 */
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistroRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @MaxLength(120)
  nombreCompleto!: string;

  @IsString()
  @IsNotEmpty({ message: 'El CUI es obligatorio' })
  @MaxLength(20)
  cui!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(120)
  correo!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MaxLength(30)
  nombreUsuario!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(72)
  password!: string;
}
