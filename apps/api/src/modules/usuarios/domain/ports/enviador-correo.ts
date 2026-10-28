/**
 * CAPA: domain/ports/  ·  PATRÓN ADAPTER
 *
 * El dominio sabe que hay que avisar por correo; no sabe cómo. Mismo criterio que el
 * almacenamiento de documentos: el puerto se declara aquí con palabras del negocio y el
 * adaptador concreto se elige por configuración, sin que ninguna regla se entere.
 *
 * POR QUÉ IMPORTA AQUÍ MÁS QUE EN OTROS SITIOS
 *   Enviar correo de verdad necesita credenciales de un servidor SMTP que en un entorno de
 *   pruebas no existen. Con un puerto, el flujo completo se puede probar y demostrar sin
 *   ellas —el adaptador de consola escribe el mensaje en el log— y el día que haya un
 *   servidor real no cambia ni una línea del caso de uso.
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
   * NO DEBE LANZAR.
   *
   * Si el correo no sale, el permiso ya se creó y la operación del usuario fue válida. Que
   * el envío falle no puede convertirse en un error que, además, le diría a quien lo
   * provocó si esa dirección existe o no. Cada adaptador se hace cargo de sus errores.
   */
  enviar(correo: Correo): Promise<void>;
}
