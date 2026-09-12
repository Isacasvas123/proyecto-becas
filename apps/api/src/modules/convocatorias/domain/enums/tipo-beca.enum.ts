/**
 * CAPA: domain/ — vocabulario del negocio.
 *
 * Los tres programas de beca que administra el Ministerio (US-006).
 *
 * Este enum se declara en el dominio y NO se importa de `@prisma/client`, aunque Prisma
 * genere uno con los mismos valores. Si mañana cambia el motor de persistencia, o si
 * Prisma renombra algo, el dominio no se entera: el mapper de infrastructure/ absorbe la
 * diferencia. Es el mismo trade-off de traducción que asumimos en arquitectura §2.2.
 */
export enum TipoBeca {
  NIVEL_MEDIO = 'NIVEL_MEDIO',
  UNIVERSITARIA = 'UNIVERSITARIA',
  POSGRADO = 'POSGRADO',
}
