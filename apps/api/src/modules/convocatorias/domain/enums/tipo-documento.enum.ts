/**
 * CAPA: domain/enums/
 * ────────────────────────────────────────────────────────────────────────────────
 * Documentos de respaldo que una convocatoria puede exigir (US-006). En el Sprint 4, la
 * carga de documentación (US-013) usará este mismo catálogo para saber qué pedirle a cada
 * estudiante.
 *
 * DETALLE DEL CONTEXTO GUATEMALTECO
 *   El DPI se emite a partir de los 18 años. La mayoría de aspirantes a una beca de nivel
 *   medio son menores de edad y **no tienen DPI**: se identifican con el certificado de
 *   nacimiento del RENAP, que ya incluye el CUI. Por eso son dos documentos distintos y la
 *   fábrica de nivel medio exige el certificado, no el DPI. Pedirle un DPI a un estudiante
 *   de 15 años dejaría fuera justamente a la población que el programa quiere atender.
 */
export enum TipoDocumento {
  DPI = 'DPI',
  CERTIFICADO_NACIMIENTO = 'CERTIFICADO_NACIMIENTO',
  CONSTANCIA_INSCRIPCION = 'CONSTANCIA_INSCRIPCION',
  CERTIFICADO_NOTAS = 'CERTIFICADO_NOTAS',
  TITULO_UNIVERSITARIO = 'TITULO_UNIVERSITARIO',
  CONSTANCIA_INGRESOS = 'CONSTANCIA_INGRESOS',
  CARTA_RECOMENDACION = 'CARTA_RECOMENDACION',
}

export const DESCRIPCION_DOCUMENTO: Readonly<Record<TipoDocumento, string>> = {
  [TipoDocumento.DPI]: 'Documento Personal de Identificación (DPI)',
  [TipoDocumento.CERTIFICADO_NACIMIENTO]: 'Certificado de nacimiento del RENAP',
  [TipoDocumento.CONSTANCIA_INSCRIPCION]: 'Constancia de inscripción del ciclo en curso',
  [TipoDocumento.CERTIFICADO_NOTAS]: 'Certificado de notas o cursos aprobados',
  [TipoDocumento.TITULO_UNIVERSITARIO]: 'Título universitario autenticado',
  [TipoDocumento.CONSTANCIA_INGRESOS]: 'Constancia de ingresos del núcleo familiar',
  [TipoDocumento.CARTA_RECOMENDACION]: 'Carta de recomendación firmada',
};
