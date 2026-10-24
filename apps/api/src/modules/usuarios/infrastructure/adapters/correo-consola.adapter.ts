/**
 * CAPA: infrastructure/adapters/  ·  PATRÓN ADAPTER
 *
 * Escribe el correo en el log en lugar de enviarlo. Es el adaptador por defecto.
 *
 * POR QUÉ EXISTE Y NO ES UNA TRAMPA
 *   Enviar correo de verdad necesita un servidor SMTP con credenciales, que un entorno de
 *   pruebas no tiene. Con este adaptador el flujo completo se puede recorrer y demostrar:
 *   el enlace aparece en el log del servidor y funciona igual que si hubiera llegado al
 *   buzón. Es el mismo criterio que ya sigue `NotificadorConsolaAdapter` mientras US-022 no
 *   exista.
 *
 *   El día que haya un servidor real se cambia `CORREO_TIPO` a `smtp` y no se toca ni una
 *   línea del caso de uso. Eso es lo que compra el puerto.
 *
 * SE REGISTRA EL ENLACE, QUE ES UN SECRETO
 *   A sabiendas. En este modo el log ES el buzón: sin el enlace, el adaptador no serviría
 *   para nada. Por eso no es el adaptador de un entorno con datos reales.
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
