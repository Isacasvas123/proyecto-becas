/**
 * Reglas de negocio que no pertenecen a un solo módulo.
 *
 * El umbral de la segunda aprobación lo usan `convocatorias`, para avisar al crearla que sus becas
 * necesitarán doble firma, y `solicitudes`, para decidir a qué estado va al aprobarse. Ponerlo en
 * uno obligaría al otro a importar su dominio, que la regla de capas prohíbe; duplicarlo dejaría
 * dos números que cambiar a la vez.
 *
 * Es una constante y no una variable de entorno porque es una regla del negocio y no configuración
 * de despliegue, igual que el tope de 5 MB de los documentos. En una variable, el mismo sistema se
 * comportaría distinto en cada servidor y nadie podría decir cuál es la regla.
 */

/**
 * Monto en quetzales a partir del cual una beca necesita una segunda aprobación.
 * Exigido por el Product Owner el 17 de octubre de 2026.
 */
export const MONTO_SEGUNDA_APROBACION = 10_000;
