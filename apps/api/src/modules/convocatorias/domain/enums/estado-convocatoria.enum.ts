/**
 * CAPA: domain/ — vocabulario del negocio.
 *
 * Ciclo de vida de una convocatoria: BORRADOR → PUBLICADA → CERRADA (US-006, US-007, US-009).
 *
 * NOTA PARA EL SPRINT 3: el walking skeleton solo LEE el estado. Las transiciones
 * (publicar, cerrar) y sus reglas se implementan en US-007 y US-009. Si al hacerlo el
 * número de reglas por estado crece, evalúen sustituir este enum por el patrón State,
 * tal como se hizo en `solicitudes` (docs/06-patrones.md §5).
 */
export enum EstadoConvocatoria {
  BORRADOR = 'BORRADOR',
  PUBLICADA = 'PUBLICADA',
  CERRADA = 'CERRADA',
}
