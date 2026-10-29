/**
 * Requisitos de elegibilidad que puede exigir una convocatoria (US-006).
 *
 * Es un catálogo cerrado y no texto libre: con "Promedio mínimo de 80", "promedio >= 80" y "80 de
 * promedio" no habría forma de comprobar automáticamente si un estudiante cumple. El precio es
 * que un requisito nuevo exige tocar el código; se acepta porque llegaría como cambio de
 * requerimiento del Product Owner.
 *
 * El dominio declara sus propios enums y no importa los de Prisma, igual que `RolUsuario`. La
 * prueba `convocatoria-prisma.mapper.spec.ts` vigila que no se desincronicen.
 */
export enum Requisito {
  NACIONALIDAD_GUATEMALTECA = 'NACIONALIDAD_GUATEMALTECA',
  ESTUDIANTE_NIVEL_MEDIO_INSCRITO = 'ESTUDIANTE_NIVEL_MEDIO_INSCRITO',
  ESTUDIANTE_UNIVERSITARIO_INSCRITO = 'ESTUDIANTE_UNIVERSITARIO_INSCRITO',
  TITULO_UNIVERSITARIO = 'TITULO_UNIVERSITARIO',
  PROMEDIO_MINIMO_70 = 'PROMEDIO_MINIMO_70',
  PROMEDIO_MINIMO_75 = 'PROMEDIO_MINIMO_75',
  PROMEDIO_MINIMO_80 = 'PROMEDIO_MINIMO_80',
  INGRESO_FAMILIAR_LIMITADO = 'INGRESO_FAMILIAR_LIMITADO',
  CARTA_RECOMENDACION = 'CARTA_RECOMENDACION',
}

/** Cómo se le explica cada requisito a una persona. Una sola fuente para la API y la interfaz. */
export const DESCRIPCION_REQUISITO: Readonly<Record<Requisito, string>> = {
  [Requisito.NACIONALIDAD_GUATEMALTECA]: 'Ser guatemalteco o guatemalteca',
  [Requisito.ESTUDIANTE_NIVEL_MEDIO_INSCRITO]:
    'Estar inscrito en un establecimiento de nivel medio del país',
  [Requisito.ESTUDIANTE_UNIVERSITARIO_INSCRITO]: 'Estar inscrito en una universidad del país',
  [Requisito.TITULO_UNIVERSITARIO]: 'Poseer título universitario de licenciatura',
  [Requisito.PROMEDIO_MINIMO_70]: 'Promedio mínimo de 70 puntos',
  [Requisito.PROMEDIO_MINIMO_75]: 'Promedio mínimo de 75 puntos',
  [Requisito.PROMEDIO_MINIMO_80]: 'Promedio mínimo de 80 puntos',
  [Requisito.INGRESO_FAMILIAR_LIMITADO]:
    'Ingreso familiar dentro del límite que fije la convocatoria',
  [Requisito.CARTA_RECOMENDACION]: 'Carta de recomendación académica o profesional',
};
