/** Estados del ciclo de vida de una solicitud. Ver `estados-solicitud.ts`. */
export enum NombreEstado {
  BORRADOR = 'BORRADOR',
  ENVIADA = 'ENVIADA',
  EN_EVALUACION = 'EN_EVALUACION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  ADJUDICADA = 'ADJUDICADA',
}

/** Resultado de resolver una solicitud (US-023). */
export enum Decision {
  APROBAR = 'APROBAR',
  RECHAZAR = 'RECHAZAR',
}
