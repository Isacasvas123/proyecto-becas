/**
 * Traduce entre HTTP y el caso de uso: lee la petición, invoca el servicio y devuelve la
 * respuesta. No tiene reglas de negocio ni menciona bcrypt, JWT o la base de datos.
 *
 * El error no se maneja aquí: `AutenticacionFallidaError` sube hasta `DominioExceptionFilter`, que
 * lo traduce a 401 con un mensaje genérico. Qué código HTTP corresponde a cada error de dominio
 * se decide en un solo lugar.
 */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { AutenticarUsuarioService } from '../../application/services/autenticar-usuario.service';
import { RegistrarEstudianteService } from '../../application/services/registrar-estudiante.service';
import { SesionIniciadaDto } from '../../application/dto/sesion-iniciada.dto';
import { LoginRequestDto } from '../dto/login-request.dto';
import { RegistroRequestDto } from '../dto/registro-request.dto';
import { Publico } from '../guards/decoradores';
import { LimiteRecuperacionGuard } from '../guards/limite-recuperacion.guard';
import { RecuperacionPasswordService } from '../../application/services/recuperacion-password.service';
import {
  RestablecerPasswordRequestDto,
  SolicitarRecuperacionRequestDto,
} from '../dto/recuperacion-request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly autenticarUsuario: AutenticarUsuarioService,
    private readonly registrarEstudiante: RegistrarEstudianteService,
    private readonly recuperacion: RecuperacionPasswordService,
  ) {}

  /**
   * US-001 — Registro de estudiante. Devuelve la sesión ya iniciada (criterio 5).
   *
   * Pública por necesidad, como el login: quien se registra todavía no tiene cuenta. Es la
   * única forma de crear cuentas desde fuera, y solo crea cuentas de ESTUDIANTE.
   */
  @Publico()
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  async registrar(@Body() peticion: RegistroRequestDto): Promise<SesionIniciadaDto> {
    return this.registrarEstudiante.ejecutar(peticion);
  }

  /**
   * US-002 — Iniciar sesión.
   *
   * `@HttpCode(200)`: por defecto NestJS responde 201 a un POST, pero aquí no se está
   * creando ningún recurso, solo verificando credenciales.
   */
  // Ruta abierta por necesidad: es el punto donde se obtiene la sesión, así que no puede
  // exigirla. Es una de las pocas rutas públicas del sistema, y cada una tiene su
  // justificación escrita (US-003).
  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async iniciarSesion(@Body() peticion: LoginRequestDto): Promise<SesionIniciadaDto> {
    return this.autenticarUsuario.ejecutar(peticion.nombreUsuario, peticion.password);
  }

  /**
   * US-035, paso 1: pedir el enlace de recuperación. Responde 204 exista o no la cuenta: contestar
   * distinto sería una forma de averiguar quién está registrado, que en un sistema de becas dice
   * quién pidió ayuda económica. Es pública porque quien olvidó su contraseña no puede iniciar
   * sesión para pedirla.
   */
  @Publico()
  @Post('recuperacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(LimiteRecuperacionGuard)
  async solicitarRecuperacion(@Body() peticion: SolicitarRecuperacionRequestDto): Promise<void> {
    await this.recuperacion.solicitar(peticion.correo);
  }

  /** US-035, paso 2 — canjear el enlace por una contraseña nueva. */
  @Publico()
  @Post('recuperacion/confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(LimiteRecuperacionGuard)
  async restablecerPassword(@Body() peticion: RestablecerPasswordRequestDto): Promise<void> {
    await this.recuperacion.restablecer(peticion.token, peticion.password);
  }
}
