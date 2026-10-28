/**
 * Adaptador de correo que escribe el mensaje en el log en vez de enviarlo. Es el de por defecto
 * (patrón Adapter).
 *
 * Enviar correo real necesita un servidor SMTP con credenciales, que un entorno de pruebas no
 * tiene. Con este el flujo completo se recorre y se demuestra: el enlace aparece en el log y
 * funciona igual que si hubiera llegado al buzón. Es el criterio que ya sigue
 * `NotificadorConsolaAdapter`. Con un servidor real se cambia `CORREO_TIPO` a `smtp` y el caso de
 * uso no se toca.
 *
 * Registra el enlace, que es un secreto, a sabiendas: en este modo el log es el buzón. Por eso no
 * es el adaptador de un entorno con datos reales.
 */
import { Injectable, Logger } from '@nestjs/common';

import { Correo, EnviadorCorreo } from '../../domain/ports/enviador-correo';

@Injectable()
export class CorreoConsolaAdapter implements EnviadorCorreo {
  private readonly logger = new Logger('Correo');

  enviar(correo: Correo): Promise<void> {
    this.logger.log(
      [
        '',
        '──────── CORREO (no se envió: modo consola) ────────',
        `Para:    ${correo.para}`,
        `Asunto:  ${correo.asunto}`,
        '',
        correo.cuerpo,
        '────────────────────────────────────────────────────',
      ].join('\n'),
    );
    return Promise.resolve();
  }
}
