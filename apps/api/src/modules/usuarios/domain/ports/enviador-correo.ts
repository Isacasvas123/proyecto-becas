/**
 * Puerto de envío de correo (patrón Adapter). El dominio sabe que hay que avisar, no cómo: el
 * puerto se declara con palabras del negocio y el adaptador se elige por configuración.
 *
 * Importa porque enviar correo real necesita credenciales SMTP que un entorno de pruebas no
 * tiene. Con el puerto el flujo se prueba sin ellas, el adaptador de consola escribe el mensaje
 * en el log, y un servidor real no cambia el caso de uso.
 */
export const ENVIADOR_CORREO = Symbol('EnviadorCorreo');

export interface Correo {
  readonly para: string;
  readonly asunto: string;
  /** Texto plano, a propósito: no se arma HTML con datos de nadie. */
  readonly cuerpo: string;
}

export interface EnviadorCorreo {
  /**
   * NO debe lanzar.
   *
   * Si el correo no sale, el permiso ya se creó y la operación del usuario fue válida. Que
   * el envío falle no puede convertirse en un error que, además, le diría a quien lo
   * provocó si esa dirección existe o no. Cada adaptador se hace cargo de sus errores.
   */
  enviar(correo: Correo): Promise<void>;
}
