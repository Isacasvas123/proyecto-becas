/**
 * Contrato de entrada de `POST /auth/login`, validado en la frontera con el `ValidationPipe`
 * global de `main.ts`.
 *
 * No exige 8 caracteres de contraseña: esa regla es del registro (US-001), donde se elige. Al
 * iniciar sesión dejaría fuera a cuentas creadas con una política anterior y revelaría la política
 * vigente antes de autenticar. Aquí solo importa si la credencial coincide.
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
