/**
 * Puerto del hash de contraseñas (patrón Adapter, estructural). Ver docs/06-patrones.md.
 *
 * El dominio necesita saber si una contraseña corresponde a un hash, sin saber que hay bcrypt,
 * cuántas rondas se usan ni qué biblioteca lo implementa. Se descartó llamar a bcrypt dentro de
 * la entidad, que acopla el dominio y vuelve lentas las pruebas, y una clase estática, que no se
 * puede sustituir en pruebas y esconde la dependencia.
 *
 * Si la política exige migrar a argon2 o subir las rondas, se escribe otro adaptador y se cambia
 * una línea en el módulo; ni la entidad ni el caso de uso se enteran.
 */
export const HASHER_PASSWORD = Symbol('HasherPassword');

export interface HasherPassword {
  /**
   * Compara una contraseña en claro contra un hash almacenado.
   *
   * La implementación debe usar comparación en tiempo constante para no filtrar
   * información por el tiempo de respuesta.
   */
  verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean>;

  /** Calcula el hash de una contraseña. Lo usa el seed y, en el Sprint 2, US-001. */
  calcular(passwordEnClaro: string): Promise<string>;
}
