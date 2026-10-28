/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-035 — Recuperar una contraseña olvidada por correo.
 *
 * SON DOS PASOS Y DOS PELIGROS DISTINTOS
 *   1. `solicitar(correo)`: crea un permiso de un solo uso y lo manda por correo.
 *   2. `restablecer(token, password)`: lo canjea por una contraseña nueva.
 *
 *   El primero puede usarse para AVERIGUAR QUIÉN TIENE CUENTA en el sistema. El segundo,
 *   para tomar una cuenta ajena si el permiso es adivinable. Cada decisión de abajo está
 *   puesta contra uno de los dos.
 *
 * POR QUÉ `solicitar` RESPONDE SIEMPRE LO MISMO
 *   Si contestara "no existe esa dirección" cuando no existe, cualquiera podría ir probando
 *   correos y quedarse con la lista de quién está registrado. En un sistema de becas eso es
 *   información sensible: dice quién pidió ayuda económica al Estado. Así que la respuesta
 *   es idéntica exista o no la cuenta, y el trabajo se hace en silencio solo si existe.
 *
 *   Ese es, además, el motivo de que `enviar` del puerto no pueda lanzar: un error del
 *   servidor de correo delataría la diferencia que esto se esfuerza en ocultar.
 *
 * POR QUÉ EL TOKEN SE GUARDA HASHEADO
 *   Durante una hora el token equivale a la contraseña. Guardarlo en claro repetiría en
 *   otra tabla el error que bcrypt evita en la de usuarios. Se guarda su hash y se busca
 *   por hash; el valor en claro solo existe el instante en que se mete en el correo.
 *
 * QUÉ NO HACE, A PROPÓSITO
 *   No inicia sesión al terminar. Quien restablece su contraseña vuelve a la pantalla de
 *   acceso y la escribe: así se confirma que la recuerda, y un enlace interceptado no deja
 *   a nadie dentro sin saber la contraseña nueva.
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
 * Un token que no existe, uno caducado y uno ya usado dan EXACTAMENTE el mismo error.
 *
 * Distinguirlos le diría a quien esté probando enlaces cuáles existieron alguna vez. Es un
 * `ReglaDeNegocioError` y no una clase propia porque el filtro de excepciones solo traduce
 * los errores de dominio conocidos: cualquier otro cae a 500, y un enlace inválido no es un
 * fallo del servidor.
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
    // La contraseña nueva se valida ANTES de gastar el token: si no cumple la política, el
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
   * El hash con el que se busca en la base.
   *
   * bcrypt usa una sal distinta cada vez, así que el hash de un mismo texto nunca se repite
   * y no sirve para buscar. Esa es la propiedad que lo hace bueno para contraseñas y
   * inservible como clave de búsqueda. Aquí se usa un hash determinista con el secreto del
   * servidor como clave: dos personas no pueden calcularlo sin ese secreto, y el mismo
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
