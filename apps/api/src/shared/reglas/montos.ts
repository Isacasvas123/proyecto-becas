/**
 * CAPA: shared/reglas/
 * ────────────────────────────────────────────────────────────────────────────────
 * Reglas de negocio que no pertenecen a un solo módulo.
 *
 * POR QUÉ AQUÍ Y NO EN `convocatorias` O EN `solicitudes`
 *   El umbral lo usan los dos: `convocatorias` para avisar al crear la convocatoria que sus becas
 *   necesitarán doble aprobación, y `solicitudes` para decidir a qué estado va al aprobarse.
 *   Ponerlo en uno obligaría al otro a importar su dominio, que es justo lo que la regla de capas
 *   prohíbe. Duplicarlo sería peor: dos números que hay que acordarse de cambiar juntos.
 *
 * POR QUÉ UNA CONSTANTE Y NO UNA VARIABLE DE ENTORNO
 *   Es una regla del negocio, no configuración de despliegue, igual que el tope de 5 MB de los
 *   documentos. Si el Ministerio cambia el umbral, cambia esta línea y las pruebas dicen de
 *   inmediato qué quedó afectado. En una variable de entorno, el mismo sistema se comportaría
 *   distinto en cada servidor y nadie podría decir cuál es la regla.
 */

/**
 * Monto en quetzales a partir del cual una beca necesita una segunda aprobación.
 * Exigido por el Product Owner el 17 de octubre de 2026.
 */
export const MONTO_SEGUNDA_APROBACION = 10_000;
