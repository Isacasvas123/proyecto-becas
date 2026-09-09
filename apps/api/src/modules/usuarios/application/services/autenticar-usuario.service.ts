/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * CASO DE USO: iniciar sesión (US-002).
 *
 * Orquesta cuatro colaboradores y no implementa ninguno: busca el usuario por el puerto
 * del repositorio, verifica la contraseña por el puerto del hasher, pregunta al dominio
 * si la cuenta puede iniciar sesión, y emite el token por el puerto del generador.
 *
 * Los tres puertos viven en domain/ports/. Este servicio no sabe que detrás hay Prisma,
 * bcrypt ni JWT: por eso su prueba unitaria corre sin base de datos y en milisegundos
 * (ver `autenticar-usuario.service.spec.ts`).
 *
 * ALCANCE (Sprint 1)
 *   Solo el inicio de sesión. El registro (US-001), el perfil (US-004), la recuperación
 *   de contraseña (US-005) y el bloqueo tras 5 intentos fallidos son SPRINT 2, y cada uno
 *   será SU PROPIO servicio en esta carpeta.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { GENERADOR_TOKEN, GeneradorToken } from '../../domain/ports/generador-token';
import { HASHER_PASSWORD, HasherPassword } from '../../domain/ports/hasher-password';
import { USUARIO_REPOSITORIO, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { AutenticacionFallidaError } from '../../../../shared/exceptions/errores-dominio';
import { SesionIniciadaDto } from '../dto/sesion-iniciada.dto';

@Injectable()
export class AutenticarUsuarioService {
  private readonly logger = new Logger(AutenticarUsuarioService.name);

  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly repositorio: UsuarioRepositorio,
    @Inject(HASHER_PASSWORD)
    private readonly hasher: HasherPassword,
    @Inject(GENERADOR_TOKEN)
    private readonly generadorToken: GeneradorToken,
  ) {}

  async ejecutar(nombreUsuarioEntrada: string, password: string): Promise<SesionIniciadaDto> {
    // El objeto de valor normaliza y valida el formato: "Admin", " ADMIN " y "admin"
    // buscan al mismo usuario.
    const nombreUsuario = NombreUsuario.crear(nombreUsuarioEntrada);
    const usuario = await this.repositorio.buscarPorNombreUsuario(nombreUsuario);

    // SEGURIDAD — Si el usuario no existe, igualmente se calcula una verificación contra
    // un hash señuelo antes de fallar. Sin esto, la respuesta sería notablemente más
    // rápida para usuarios inexistentes que para contraseñas incorrectas, y ese
    // diferencial de tiempo permitiría enumerar cuentas válidas del sistema.
    if (usuario === null) {
      await this.hasher.verificar(password, HASH_SENUELO);
      this.logger.warn(`Intento de acceso con usuario inexistente: ${nombreUsuario.valor}`);
      throw new AutenticacionFallidaError('El usuario no existe');
    }

    const passwordCorrecta = await this.hasher.verificar(password, usuario.hashAlmacenado());
    if (!passwordCorrecta) {
      this.logger.warn(`Contraseña incorrecta para el usuario ${nombreUsuario.valor}`);
      throw new AutenticacionFallidaError('Contraseña incorrecta');
    }

    // Regla de negocio del dominio: una cuenta desactivada no entra.
    usuario.asegurarPuedeIniciarSesion();

    const token = await this.generadorToken.emitir(usuario);
    this.logger.log(`Sesión iniciada: ${usuario.nombreUsuario.valor} (${usuario.rol})`);

    return {
      token: token.valor,
      expiraEn: token.expiraEn.toISOString(),
      usuario: {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario.valor,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}

/**
 * Hash bcrypt válido de una cadena arbitraria, usado solo para igualar el tiempo de
 * respuesta cuando el usuario no existe. No corresponde a ninguna contraseña real ni
 * da acceso a nada: es un valor de relleno.
 */
const HASH_SENUELO = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.PjMkq4Zt2xUFhE8Jd6QK2zHRy4mS';
