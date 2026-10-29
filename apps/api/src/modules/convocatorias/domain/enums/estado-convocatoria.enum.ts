/**
 * Ciclo de vida de una convocatoria: BORRADOR → PUBLICADA → CERRADA (US-006, US-007, US-009).
 *
 * Si crece el número de reglas por estado, conviene sustituir este enum por el patrón State,
 * como en `solicitudes` (docs/06-patrones.md §5).
 */
export enum EstadoConvocatoria {
  BORRADOR = 'BORRADOR',
  PUBLICADA = 'PUBLICADA',
  CERRADA = 'CERRADA',
}
