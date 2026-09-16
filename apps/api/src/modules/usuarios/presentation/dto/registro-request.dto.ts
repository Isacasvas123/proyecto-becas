/**
 * CAPA: presentation/dto/
 * ────────────────────────────────────────────────────────────────────────────────
 * Contrato de entrada de `POST /auth/registro` (US-001).
 *
 * Aquí se valida la FORMA. El formato del CUI y la política de contraseña son reglas del
 * dominio y se comprueban allí, con un mensaje que dice exactamente qué falta.
 *
 * FÍJENSE EN LO QUE NO HAY: ni `rol` ni `activo`. Con `forbidNonWhitelisted` en `main.ts`, una
 * petición que intente mandar `"rol": "ADMINISTRADOR"` se rechaza con 400 antes de llegar al
 * caso de uso, y aun si llegara, `Usuario.nuevoEstudiante` no acepta rol.
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
