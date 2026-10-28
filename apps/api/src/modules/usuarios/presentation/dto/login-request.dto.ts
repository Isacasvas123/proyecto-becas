/**
 * CAPA: presentation/dto/
 * ────────────────────────────────────────────────────────────────────────────────
 * Contrato de entrada de `POST /auth/login`. Se valida en la frontera del sistema, antes
 * de que el dato toque la capa de aplicación (`ValidationPipe` global en `main.ts`).
 *
 * POR QUÉ AQUÍ NO SE EXIGEN 8 CARACTERES DE CONTRASEÑA
 *   Esa regla —mínimo 8 caracteres, una mayúscula y un número— pertenece al REGISTRO
 *   (US-001), donde se elige la contraseña. Aplicarla también al inicio de sesión sería
 *   un error: dejaría fuera a cualquier cuenta creada bajo una política anterior, y le
 *   revelaría a un atacante cuál es la política vigente antes siquiera de autenticarse.
 *   Al iniciar sesión solo importa si la credencial coincide.
 */
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  @MaxLength(30)
  nombreUsuario!: string;

  /**
   * `MaxLength` acotado: bcrypt solo considera los primeros 72 bytes, y aceptar cadenas
   * arbitrariamente largas permitiría saturar la CPU enviando contraseñas enormes.
   */
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(72)
  password!: string;
}
