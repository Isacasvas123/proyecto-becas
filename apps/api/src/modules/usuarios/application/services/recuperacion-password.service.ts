/**
 * US-035: recuperar una contraseña olvidada por correo.
 *
 * Son dos pasos con dos riesgos distintos. `solicitar(correo)` crea un permiso de un solo uso y
 * lo manda por correo; puede servir para averiguar quién tiene cuenta. `restablecer(token,
 * password)` lo canjea por una contraseña nueva; puede servir para tomar una cuenta ajena si el
 * permiso es adivinable. Cada decisión de abajo protege contra uno de los dos.
 *
 * `solicitar` responde siempre lo mismo. Si dijera "no existe esa dirección", cualquiera podría
 * armar la lista de quién está registrado, y en un sistema de becas eso revela quién pidió ayuda
 * económica al Estado. Por lo mismo el `enviar` del puerto no puede lanzar: un error del servidor
 * de correo delataría la diferencia.
 *
 * El token se guarda hasheado: durante una hora equivale a la contraseña, y en claro repetiría en
 * otra tabla el error que bcrypt evita en la de usuarios. El valor en claro solo existe el
 * instante en que se mete en el correo.
 *
 * No inicia sesión al terminar: la persona vuelve al acceso y escribe la contraseña nueva, con lo
 * que confirma que la recuerda y un enlace interceptado no deja a nadie dentro.
 */
import { createHmac, randomBytes, randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TokenRecuperacion } from '../../domain/entities/token-recuperacion.entity';
import { Correo, ENVIADOR_CORREO, EnviadorCorreo } from '../../domain/ports/enviador-correo';
import { HASHER_PASSWORD, HasherPassword } from '../../domain/ports/hasher-password';
import {
  TOKEN_RECUPERACION_REPOSITORIO,
  TokenRecuperacionRepositorio,
} from '../../domain/ports/token-recuperacion.repositorio';
import { USUARIO_REPOSITORIO, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { validarPoliticaContrasena } from '../../domain/value-objects/politica-contrasena';
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

/**
 * Un token inexistente, uno caducado y uno ya usado dan el mismo error: distinguirlos diría a
 * quien prueba enlaces cuáles existieron. Es un `ReglaDeNegocioError` y no una clase propia
 * porque el filtro solo traduce errores de dominio conocidos y cualquier otro cae a 500, y un
 * enlace inválido no es un fallo del servidor.
 */
const enlaceInvalido = (): ReglaDeNegocioError =>
  new ReglaDeNegocioError(
    'Este enlace ya no es válido. Solicite uno nuevo desde la pantalla de acceso.',
  );

/**
 * 32 bytes de aleatoriedad criptográfica, en hexadecimal.
 *
 * No es `Math.random()` ni un UUID: los dos son predecibles de maneras distintas. Con 256
 * bits, adivinar un token es tan improbable como adivinar una clave.
 */
const BYTES_DE_TOKEN = 32;

@Injectable()
export class RecuperacionPasswordService {
  private readonly logger = new Logger(RecuperacionPasswordService.name);

  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly usuarios: UsuarioRepositorio,
    @Inject(TOKEN_RECUPERACION_REPOSITORIO)
    private readonly tokens: TokenRecuperacionRepositorio,
    @Inject(HASHER_PASSWORD)
    private readonly hasher: HasherPassword,
    @Inject(ENVIADOR_CORREO)
    private readonly correo: EnviadorCorreo,
    private readonly config: ConfigService,
  ) {}

  /**
   * Paso 1. Devuelve siempre `void`, exista o no la cuenta: quien llama no puede distinguir
   * los dos casos, y ese es justamente el punto.
   */
  async solicitar(correo: string, ahora: Date = new Date()): Promise<void> {
    const usuario = await this.usuarios.buscarPorCorreo(correo.trim().toLowerCase());

    if (usuario === null || !usuario.activo) {
      // Se registra para poder auditar intentos, pero sin decir nada hacia fuera. Una cuenta
      // desactivada se trata como inexistente: reactivarla es decisión de administración.
      this.logger.log('Solicitud de recuperación para una dirección sin cuenta activa.');
      return;
    }

    const enClaro = randomBytes(BYTES_DE_TOKEN).toString('hex');
    const token = TokenRecuperacion.nuevo({
      id: randomUUID(),
      usuarioId: usuario.id,
      hashToken: this.hashDeBusqueda(enClaro),
      ahora,
    });

    await this.tokens.crear(token);
    await this.correo.enviar(this.mensaje(usuario.correo, usuario.nombreCompleto, enClaro));
  }

  /** Paso 2. Canjea el permiso por una contraseña nueva. */
  async restablecer(
    enClaro: string,
    passwordNueva: string,
    ahora: Date = new Date(),
  ): Promise<void> {
    // La contraseña nueva se valida antes de gastar el token: si no cumple la política, el
    // enlace tiene que seguir sirviendo para volver a intentarlo.
    validarPoliticaContrasena(passwordNueva);

    const token = await this.tokens.buscarPorHash(this.hashDeBusqueda(enClaro));
    if (token === null) {
      throw enlaceInvalido();
    }

    const usado = token.usar(ahora);
    const [usuario] = await this.usuarios.buscarPorIds([token.usuarioId]);
    if (usuario === undefined) {
      throw enlaceInvalido();
    }

    await this.usuarios.actualizarPassword(
      usuario.conNuevaPassword(await this.hasher.calcular(passwordNueva)),
    );
    await this.tokens.marcarUsadoEInvalidarLosDemas(usado);

    this.logger.log(`Contraseña restablecida para ${usuario.nombreUsuario}.`);
  }

  /**
   * El hash con el que se busca en la base. bcrypt usa una sal distinta cada vez, así que el hash
   * de un mismo texto nunca se repite y no sirve para buscar. Aquí se usa un hash determinista
   * con el secreto del servidor como clave: nadie puede calcularlo sin ese secreto y el mismo
   * token siempre da el mismo resultado.
   */
  private hashDeBusqueda(enClaro: string): string {
    const secreto = this.config.get<string>('JWT_SECRET') ?? 'secreto-de-desarrollo';
    return createHmac('sha256', secreto).update(enClaro).digest('hex');
  }

  private mensaje(para: string, nombre: string | null, enClaro: string): Correo {
    const base = this.config.get<string>('CORS_ORIGEN') ?? 'http://localhost:5173';
    const enlace = `${base.replace(/\/$/, '')}/recuperar/${enClaro}`;

    return {
      para,
      asunto: 'Restablezca su contraseña · Plataforma Nacional de Becas',
      cuerpo: [
        `${nombre ?? 'Buenas tardes'}:`,
        '',
        'Recibimos una solicitud para restablecer la contraseña de su cuenta.',
        'Abra este enlace para elegir una nueva. Vence en una hora y sirve una sola vez:',
        '',
        enlace,
        '',
        'Si no fue usted quien lo pidió, puede ignorar este mensaje: su contraseña',
        'actual sigue funcionando y nadie ha entrado a su cuenta.',
        '',
        'Ministerio de Educación · Fondo Nacional de Becas',
      ].join('\n'),
    };
  }
}
