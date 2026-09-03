/**
 * CAPA: domain/ports/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ PROBLEMA RESUELVE
 *   El dominio necesita responder "¿esta contraseña corresponde a este hash?", pero no
 *   debe saber que por debajo hay bcrypt, ni cuántas rondas se usan, ni qué biblioteca lo
 *   implementa. Si `Usuario` importara bcrypt directamente, la entidad quedaría atada a
 *   una dependencia de infraestructura y no se podría probar sin ella.
 *
 * QUÉ ALTERNATIVAS SE DESCARTARON
 *   - Llamar a bcrypt dentro de la entidad: acopla el dominio a una biblioteca externa y
 *     vuelve lentas las pruebas unitarias (bcrypt es deliberadamente costoso).
 *   - Una clase utilitaria estática: no se puede sustituir en pruebas y esconde la
 *     dependencia en lugar de declararla.
 *
 * VENTAJA
 *   Cuando la política de seguridad del Ministerio exija migrar a argon2 —o subir las
 *   rondas de bcrypt— se escribe otro adaptador y se cambia una línea en el módulo.
 *   Ni la entidad ni el caso de uso se enteran.
 *
 * Ver docs/06-patrones.md, sección "Adapter".
 */
export const HASHER_PASSWORD = Symbol('HasherPassword');

export interface HasherPassword {
  /**
   * Compara una contraseña en claro contra un hash almacenado.
   *
   * La implementación DEBE usar comparación en tiempo constante para no filtrar
   * información por el tiempo de respuesta.
   */
  verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean>;

  /** Calcula el hash de una contraseña. Lo usa el seed y, en el Sprint 2, US-001. */
  calcular(passwordEnClaro: string): Promise<string>;
}
