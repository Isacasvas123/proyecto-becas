/**
 * DEFECTO CORREGIDO (tarea S1-12) — enums duplicados sin vigilancia.
 *
 * El dominio declara sus propios `TipoBeca` y `EstadoConvocatoria` en lugar de importar los
 * de Prisma, porque importarlos metería el ORM dentro de `domain/` y rompería la regla de
 * capas (docs/05-arquitectura.md §2.3).
 *
 * El precio de esa decisión es tener DOS listas que deben coincidir. Si alguien agrega un
 * tipo de beca al `schema.prisma` y olvida el enum del dominio, el desajuste no se detecta
 * al compilar: explota en tiempo de ejecución la primera vez que aparezca una convocatoria
 * de ese tipo, probablemente en Staging y delante del Product Owner.
 *
 * `usuarios` ya tenía esta vigilancia sobre `RolUsuario`; `convocatorias` no la tenía.
 * Estas pruebas la añaden: el desajuste ahora falla en CI, no en producción.
 */
import { EstadoConvocatoria as EstadoPrisma, TipoBeca as TipoPrisma } from '@prisma/client';

import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';

describe('sincronización de enums entre el dominio y Prisma', () => {
  it('TipoBeca declara exactamente los mismos valores en ambos lados', () => {
    const enDominio = Object.values(TipoBeca).sort();
    const enPrisma = Object.values(TipoPrisma).sort();

    expect(enDominio).toEqual(enPrisma);
  });

  it('EstadoConvocatoria declara exactamente los mismos valores en ambos lados', () => {
    const enDominio = Object.values(EstadoConvocatoria).sort();
    const enPrisma = Object.values(EstadoPrisma).sort();

    expect(enDominio).toEqual(enPrisma);
  });

  // Esta comprobación es distinta de la anterior: la de arriba verifica los VALORES, esta
  // verifica las CLAVES. Un enum donde la clave y el valor difieran —por ejemplo
  // `POSGRADO = 'POSTGRADO'`— pasaría la primera prueba y rompería igualmente el mapeo.
  it('las claves y los valores coinciden, para que el mapeo por clave sea seguro', () => {
    for (const [clave, valor] of Object.entries(TipoBeca)) {
      expect(clave).toBe(valor);
    }

    for (const [clave, valor] of Object.entries(EstadoConvocatoria)) {
      expect(clave).toBe(valor);
    }
  });
});
