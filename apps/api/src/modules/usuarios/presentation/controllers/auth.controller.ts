/**
 * CAPA: presentation/controllers/
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   La traducción entre HTTP y el caso de uso: leer la petición, invocar el servicio,
 *   devolver la respuesta. Nada más.
 *
 * QUÉ NO VA AQUÍ
 *   Ni una regla de negocio. Nótese que este archivo no menciona bcrypt, ni JWT, ni la
 *   base de datos, ni qué significa que una cuenta esté activa. Si mañana el inicio de
 *   sesión se expusiera además por otro canal, se reutilizaría el mismo servicio.
 *
 * EL ERROR NO SE MANEJA AQUÍ
 *   `AutenticacionFallidaError` sube sin capturar hasta `DominioExceptionFilter`, que lo
 *   traduce a 401 con un mensaje genérico. La decisión de qué código HTTP corresponde a
 *   cada error de dominio vive en un solo lugar del proyecto.
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AutenticarUsuarioService } from '../../application/services/autenticar-usuario.service';
import { SesionIniciadaDto } from '../../application/dto/sesion-iniciada.dto';
import { LoginRequestDto } from '../dto/login-request.dto';
import { Publico } from '../guards/decoradores';

@Controller('auth')
export class AuthController {
  constructor(private readonly autenticarUsuario: AutenticarUsuarioService) {}

  /**
   * US-002 — Iniciar sesión.
   *
   * `@HttpCode(200)`: por defecto NestJS responde 201 a un POST, pero aquí no se está
   * creando ningún recurso, solo verificando credenciales.
   */
  // Ruta abierta por necesidad: es el punto donde se OBTIENE la sesión, así que no puede
  // exigirla. Es una de las tres únicas rutas públicas del sistema, y cada una tiene su
  // justificación escrita (US-003).
  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async iniciarSesion(@Body() peticion: LoginRequestDto): Promise<SesionIniciadaDto> {
    return this.autenticarUsuario.ejecutar(peticion.nombreUsuario, peticion.password);
  }
}
