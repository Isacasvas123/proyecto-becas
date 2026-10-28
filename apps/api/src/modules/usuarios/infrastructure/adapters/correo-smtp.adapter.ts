/**
 * CAPA: infrastructure/adapters/  ·  PATRÓN ADAPTER
 *
 * Envía el correo de verdad, por SMTP. Se elige con `CORREO_TIPO=smtp`.
 *
 * POR QUÉ SE HABLA SMTP A MANO Y NO CON UNA LIBRERÍA
 *   Porque el proyecto no tiene ninguna, y meter una dependencia nueva a días de la entrega
 *   es riesgo que no compensa. El correo que hay que mandar es uno solo, de texto plano,
 *   sin adjuntos: eso son seis órdenes del protocolo sobre un socket TLS. Lo que una
 *   librería aporta —HTML, adjuntos, reintentos, colas— aquí no se usa.
 *
 *   Si mañana hacen falta esas cosas, se cambia ESTE archivo y nada más. Para eso está el
 *   puerto.
 *
 * NO LANZA NUNCA
 *   Lo exige el contrato del puerto, y aquí tiene una razón de seguridad además de la
 *   obvia: `solicitar` responde igual exista o no la cuenta, y un error del servidor de
 *   correo delataría la diferencia.
 */
import { connect } from 'node:tls';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Correo, EnviadorCorreo } from '../../domain/ports/enviador-correo';

const TIEMPO_LIMITE_MS = 15_000;

@Injectable()
export class CorreoSmtpAdapter implements EnviadorCorreo {
  private readonly logger = new Logger('Correo');

  constructor(private readonly config: ConfigService) {}

  async enviar(correo: Correo): Promise<void> {
    try {
      await this.hablarConElServidor(correo);
      this.logger.log(`Correo enviado a ${correo.para}.`);
    } catch (causa: unknown) {
      // Se registra el fallo, nunca el cuerpo: ahí va el enlace de recuperación.
      this.logger.error(
        `No se pudo enviar el correo a ${correo.para}: ${causa instanceof Error ? causa.message : 'error desconocido'}`,
      );
    }
  }

  private hablarConElServidor(correo: Correo): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST') ?? '';
    const puerto = Number(this.config.get<string>('SMTP_PUERTO') ?? 465);
    const usuario = this.config.get<string>('SMTP_USUARIO') ?? '';
    const password = this.config.get<string>('SMTP_PASSWORD') ?? '';
    const remitente = this.config.get<string>('SMTP_REMITENTE') ?? usuario;

    if (host === '' || usuario === '' || password === '') {
      return Promise.reject(new Error('Faltan SMTP_HOST, SMTP_USUARIO o SMTP_PASSWORD'));
    }

    return new Promise<void>((resolver, rechazar) => {
      const socket = connect({ host, port: puerto, servername: host });
      socket.setTimeout(TIEMPO_LIMITE_MS);

      // Las órdenes se mandan en orden; cada una espera la respuesta de la anterior.
      const ordenes = [
        `EHLO ${host}`,
        'AUTH LOGIN',
        Buffer.from(usuario).toString('base64'),
        Buffer.from(password).toString('base64'),
        `MAIL FROM:<${remitente}>`,
        `RCPT TO:<${correo.para}>`,
        'DATA',
        this.mensaje(remitente, correo),
        'QUIT',
      ];
      let siguiente = 0;
      let acumulado = '';

      const fallar = (motivo: string) => {
        socket.destroy();
        rechazar(new Error(motivo));
      };

      /**
       * ¿Terminó de llegar la respuesta?
       *
       * SMTP contesta en una o VARIAS líneas, y solo la última lleva un espacio tras el
       * código; las intermedias llevan un guion. Gmail responde al EHLO con cinco líneas:
       *
       *     250-smtp.gmail.com at your service
       *     250-SIZE 35882577
       *     250 SMTPUTF8          ← esta, con espacio, es la que cierra
       *
       * Además TCP puede partir eso en varios trozos. La versión anterior avanzaba al
       * comando siguiente en CADA trozo recibido, así que con una respuesta partida mandaba
       * la contraseña fuera de sitio y la sesión fallaba. Por eso se acumula y solo se
       * avanza cuando la respuesta está entera.
       */
      const respuestaCompleta = (texto: string): boolean => /^\d{3} [^\r\n]*\r\n$/m.test(texto);

      socket.on('data', (trozo: Buffer) => {
        acumulado += trozo.toString('utf8');
        if (!respuestaCompleta(acumulado)) return;

        const respuesta = acumulado;
        acumulado = '';

        // 4xx y 5xx son errores de SMTP; 2xx y 3xx dejan continuar.
        if (/^[45]/.test(respuesta)) return fallar(respuesta.split('\r\n')[0]);

        if (siguiente >= ordenes.length) {
          socket.end();
          return resolver();
        }
        socket.write(`${ordenes[siguiente++]}\r\n`);
      });

      socket.on('timeout', () => fallar('el servidor de correo no respondió a tiempo'));
      socket.on('error', (error: Error) => fallar(error.message));
    });
  }

  /** El cuerpo del mensaje, terminado en el punto solo que SMTP espera tras `DATA`. */
  private mensaje(remitente: string, correo: Correo): string {
    return [
      `From: Plataforma Nacional de Becas <${remitente}>`,
      `To: <${correo.para}>`,
      `Subject: ${correo.asunto}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      // Un punto solo al principio de una línea cierra el mensaje: hay que escaparlo.
      correo.cuerpo.replace(/^\./gm, '..'),
      '.',
    ].join('\r\n');
  }
}
