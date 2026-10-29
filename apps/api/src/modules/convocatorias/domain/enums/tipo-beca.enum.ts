/**
 * Los tres programas de beca que administra el Ministerio (US-006).
 *
 * Se declara en el dominio y no se importa de `@prisma/client` aunque Prisma genere uno igual: si
 * cambia el motor de persistencia, el dominio no se entera y el mapper de infrastructure/ absorbe
 * la diferencia (trade-off de traducción de arquitectura §2.2).
 */
export enum TipoBeca {
  NIVEL_MEDIO = 'NIVEL_MEDIO',
  UNIVERSITARIA = 'UNIVERSITARIA',
  POSGRADO = 'POSGRADO',
}
