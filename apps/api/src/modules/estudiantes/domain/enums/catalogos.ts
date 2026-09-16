/**
 * CAPA: domain/enums/
 * ────────────────────────────────────────────────────────────────────────────────
 * Catálogos del perfil académico (US-011).
 *
 * POR QUÉ LOS DEPARTAMENTOS SON UN CATÁLOGO CERRADO
 *   US-031 pide un reporte de becas adjudicadas **por región**. Si el departamento fuera texto
 *   libre, "Quetzaltenango", "Xela" y "quetzaltenango" serían tres regiones distintas y el reporte
 *   no serviría. Son los 22 departamentos de Guatemala; no cambian.
 *
 *   El MUNICIPIO sí es texto libre: son 340 y el reporte pide región, no municipio. Si algún día
 *   se necesita agrupar por municipio, el cambio es agregar el catálogo, no migrar datos sucios de
 *   departamento.
 */
export enum NivelAcademico {
  NIVEL_MEDIO = 'NIVEL_MEDIO',
  UNIVERSITARIO = 'UNIVERSITARIO',
  POSGRADO = 'POSGRADO',
}

export enum Departamento {
  ALTA_VERAPAZ = 'ALTA_VERAPAZ',
  BAJA_VERAPAZ = 'BAJA_VERAPAZ',
  CHIMALTENANGO = 'CHIMALTENANGO',
  CHIQUIMULA = 'CHIQUIMULA',
  EL_PROGRESO = 'EL_PROGRESO',
  ESCUINTLA = 'ESCUINTLA',
  GUATEMALA = 'GUATEMALA',
  HUEHUETENANGO = 'HUEHUETENANGO',
  IZABAL = 'IZABAL',
  JALAPA = 'JALAPA',
  JUTIAPA = 'JUTIAPA',
  PETEN = 'PETEN',
  QUETZALTENANGO = 'QUETZALTENANGO',
  QUICHE = 'QUICHE',
  RETALHULEU = 'RETALHULEU',
  SACATEPEQUEZ = 'SACATEPEQUEZ',
  SAN_MARCOS = 'SAN_MARCOS',
  SANTA_ROSA = 'SANTA_ROSA',
  SOLOLA = 'SOLOLA',
  SUCHITEPEQUEZ = 'SUCHITEPEQUEZ',
  TOTONICAPAN = 'TOTONICAPAN',
  ZACAPA = 'ZACAPA',
}

export const NOMBRE_DEPARTAMENTO: Readonly<Record<Departamento, string>> = {
  [Departamento.ALTA_VERAPAZ]: 'Alta Verapaz',
  [Departamento.BAJA_VERAPAZ]: 'Baja Verapaz',
  [Departamento.CHIMALTENANGO]: 'Chimaltenango',
  [Departamento.CHIQUIMULA]: 'Chiquimula',
  [Departamento.EL_PROGRESO]: 'El Progreso',
  [Departamento.ESCUINTLA]: 'Escuintla',
  [Departamento.GUATEMALA]: 'Guatemala',
  [Departamento.HUEHUETENANGO]: 'Huehuetenango',
  [Departamento.IZABAL]: 'Izabal',
  [Departamento.JALAPA]: 'Jalapa',
  [Departamento.JUTIAPA]: 'Jutiapa',
  [Departamento.PETEN]: 'Petén',
  [Departamento.QUETZALTENANGO]: 'Quetzaltenango',
  [Departamento.QUICHE]: 'Quiché',
  [Departamento.RETALHULEU]: 'Retalhuleu',
  [Departamento.SACATEPEQUEZ]: 'Sacatepéquez',
  [Departamento.SAN_MARCOS]: 'San Marcos',
  [Departamento.SANTA_ROSA]: 'Santa Rosa',
  [Departamento.SOLOLA]: 'Sololá',
  [Departamento.SUCHITEPEQUEZ]: 'Suchitepéquez',
  [Departamento.TOTONICAPAN]: 'Totonicapán',
  [Departamento.ZACAPA]: 'Zacapa',
};
