/** Estados del ciclo de vida de una solicitud. Ver `estados-solicitud.ts`. */
export enum NombreEstado {
  BORRADOR = 'BORRADOR',
  ENVIADA = 'ENVIADA',
  EN_EVALUACION = 'EN_EVALUACION',
  /**
   * Primera aprobación dada, falta la segunda. Exigencia del PO del 17 de octubre de 2026: las
   * becas de más de Q10,000 necesitan dos aprobaciones. Mientras está aquí, la solicitud **no
   * ocupa cupo**: el cupo se reserva al completarse la segunda.
   */
  APROBACION_PENDIENTE = 'APROBACION_PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  ADJUDICADA = 'ADJUDICADA',
}

/** Resultado de resolver una solicitud (US-023). */
export enum Decision {
  APROBAR = 'APROBAR',
  RECHAZAR = 'RECHAZAR',
}
