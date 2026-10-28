/**
 * El adaptador SMTP, contra un servidor de mentira que se comporta como Gmail.
 *
 * POR QUÉ ESTA PRUEBA EXISTE
 *   Este adaptador habla el protocolo a mano, y el protocolo tiene dos trampas que no se ven
 *   leyendo el código:
 *
 *     1. Una respuesta de SMTP puede ocupar VARIAS líneas. Gmail contesta al `EHLO` con
 *        cinco, y solo la última lleva un espacio tras el código; las demás, un guion.
 *     2. TCP puede partir esa respuesta en varios trozos.
 *
 *   El servidor de abajo hace las dos cosas: responde al `EHLO` en cinco líneas y las manda
 *   en dos trozos separados. La prueba comprueba que, aun así, la conversación se completa en
 *   el orden correcto y el usuario y la contraseña llegan donde deben.
 *
 * LO QUE ESTA PRUEBA NO DEMUESTRA
 *   No demuestra que una implementación que NO acumule falle. Se intentó: desactivando la
 *   acumulación, estas cuatro pruebas siguen pasando, porque este servidor no exige que cada
 *   comando llegue después de su respuesta. Esperar la respuesta completa es lo que manda el
 *   protocolo y por eso está así, pero la afirmación «sin esto se rompe» no está respaldada
 *   por esta prueba y no debe hacerse.
 *
 *   La validación que falta es contra un servidor real. Mientras no se haga, el adaptador
 *   SMTP se considera no verificado; el de consola es el que está en uso.
 *
 * NO HAY TLS NI CREDENCIALES REALES
 *   Se prueba la conversación, no el cifrado. El socket va en claro contra `localhost`.
 */
import { createServer, type Server, type Socket } from 'node:net';

import { ConfigService } from '@nestjs/config';

import { CorreoSmtpAdapter } from './correo-smtp.adapter';

interface ServidorFalso {
  readonly servidor: Server;
  readonly puerto: number;
  /** Todo lo que el adaptador envió, línea por línea. */
  readonly recibido: string[];
}

/** Un SMTP mínimo que imita el comportamiento incómodo de Gmail. */
function levantarServidor(opciones: { rechazarEn?: string } = {}): Promise<ServidorFalso> {
  const recibido: string[] = [];

  const servidor = createServer((socket: Socket) => {
    socket.write('220 smtp.falso.gt ESMTP listo\r\n');

    socket.on('data', (trozo) => {
      const linea = trozo.toString('utf8').trim();
      recibido.push(linea);

      if (opciones.rechazarEn !== undefined && linea.startsWith(opciones.rechazarEn)) {
        socket.write('535 5.7.8 Usuario o contraseña incorrectos\r\n');
        return;
      }

      if (linea.startsWith('EHLO')) {
        // En DOS trozos, y con la última línea separada: esto es lo que rompía la versión
        // anterior del adaptador.
        socket.write('250-smtp.falso.gt a su servicio\r\n250-SIZE 35882577\r\n');
        setTimeout(() => socket.write('250-8BITMIME\r\n250 SMTPUTF8\r\n'), 5);
        return;
      }

      if (linea.startsWith('AUTH LOGIN')) return void socket.write('334 VXNlcm5hbWU6\r\n');
      if (linea.startsWith('DATA')) return void socket.write('354 Adelante\r\n');
      if (linea.startsWith('QUIT')) return void socket.write('221 Adiós\r\n');
      socket.write('250 De acuerdo\r\n');
    });
  });

  return new Promise((resolver) => {
    servidor.listen(0, '127.0.0.1', () => {
      const direccion = servidor.address();
      const puerto = typeof direccion === 'object' && direccion !== null ? direccion.port : 0;
      resolver({ servidor, puerto, recibido });
    });
  });
}

/** El adaptador usa TLS; para la prueba se le cambia por una conexión en claro. */
jest.mock('node:tls', () => ({
  connect: (opciones: { host: string; port: number }) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('node:net') as typeof import('node:net')).connect(opciones.port, opciones.host),
}));

describe('CorreoSmtpAdapter', () => {
  let falso: ServidorFalso;

  const adaptador = (puerto: number, cambios: Record<string, string> = {}): CorreoSmtpAdapter => {
    const valores: Record<string, string> = {
      SMTP_HOST: '127.0.0.1',
      SMTP_PUERTO: String(puerto),
      SMTP_USUARIO: 'becas@ejemplo.gt',
      SMTP_PASSWORD: 'la-clave',
      SMTP_REMITENTE: 'becas@ejemplo.gt',
      ...cambios,
    };
    return new CorreoSmtpAdapter({
      get: (clave: string) => valores[clave],
    } as unknown as ConfigService);
  };

  const correo = {
    para: 'ana@ejemplo.gt',
    asunto: 'Restablezca su contraseña',
    cuerpo: 'Abra este enlace:\nhttp://localhost:5173/recuperar/abc',
  };

  afterEach(() => {
    falso.servidor.close();
  });

  it('completa la conversación aunque el servidor responda en varias líneas y en varios trozos', async () => {
    falso = await levantarServidor();

    await adaptador(falso.puerto).enviar(correo);

    // El orden es el del protocolo. Si la acumulación estuviera mal, el usuario y la
    // contraseña llegarían en el sitio equivocado y esta lista no cuadraría.
    expect(falso.recibido[0]).toMatch(/^EHLO /);
    expect(falso.recibido[1]).toBe('AUTH LOGIN');
    expect(Buffer.from(falso.recibido[2], 'base64').toString()).toBe('becas@ejemplo.gt');
    expect(Buffer.from(falso.recibido[3], 'base64').toString()).toBe('la-clave');
    expect(falso.recibido[4]).toBe('MAIL FROM:<becas@ejemplo.gt>');
    expect(falso.recibido[5]).toBe('RCPT TO:<ana@ejemplo.gt>');
    expect(falso.recibido[6]).toBe('DATA');
  });

  it('el mensaje lleva su cabecera, el cuerpo y el punto que lo cierra', async () => {
    falso = await levantarServidor();

    await adaptador(falso.puerto).enviar(correo);

    const mensaje = falso.recibido[7];
    expect(mensaje).toContain('Subject: Restablezca su contraseña');
    expect(mensaje).toContain('To: <ana@ejemplo.gt>');
    expect(mensaje).toContain('charset=UTF-8');
    expect(mensaje).toContain('http://localhost:5173/recuperar/abc');
    expect(mensaje.endsWith('.')).toBe(true);
  });

  /**
   * NO LANZA NUNCA, aunque el servidor rechace las credenciales. Lo exige el contrato del
   * puerto: si esto lanzara, el error subiría hasta la respuesta HTTP y delataría que esa
   * dirección tiene cuenta, que es justo lo que el caso de uso se esfuerza en ocultar.
   */
  it('un rechazo del servidor no se convierte en un error de la petición', async () => {
    falso = await levantarServidor({ rechazarEn: 'AUTH LOGIN' });

    await expect(adaptador(falso.puerto).enviar(correo)).resolves.toBeUndefined();
  });

  it('tampoco lanza si falta la configuración', async () => {
    falso = await levantarServidor();

    await expect(
      adaptador(falso.puerto, { SMTP_HOST: '' }).enviar(correo),
    ).resolves.toBeUndefined();
  });
});
