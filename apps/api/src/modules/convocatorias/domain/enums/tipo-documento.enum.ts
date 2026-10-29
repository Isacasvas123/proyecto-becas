/**
 * Documentos de respaldo que puede exigir una convocatoria (US-006). La carga de documentación
 * (US-013) usa este mismo catálogo.
 *
 * El DPI se emite a los 18 años y la mayoría de aspirantes de nivel medio son menores, así que se
 * identifican con el certificado de nacimiento del RENAP, que ya incluye el CUI. Por eso son dos
 * documentos y la fábrica de nivel medio exige el certificado: pedir DPI dejaría fuera a la
 * población que el programa quiere atender.
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
