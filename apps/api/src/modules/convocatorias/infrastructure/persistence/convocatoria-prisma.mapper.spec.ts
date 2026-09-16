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
import {
  EstadoConvocatoria as EstadoPrisma,
  Requisito as RequisitoPrisma,
  TipoBeca as TipoPrisma,
  TipoDocumento as TipoDocumentoPrisma,
} from '@prisma/client';

import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
import { PeriodoPostulacion } from '../../domain/value-objects/periodo-postulacion.vo';
import { aDominio, aPersistencia } from './convocatoria-prisma.mapper';

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

  it('Requisito y TipoDocumento (US-006) declaran los mismos valores en ambos lados', () => {
    expect(Object.values(Requisito).sort()).toEqual(Object.values(RequisitoPrisma).sort());
    expect(Object.values(TipoDocumento).sort()).toEqual(Object.values(TipoDocumentoPrisma).sort());
  });
});

describe('convocatoria-prisma.mapper: ida y vuelta', () => {
  it('lo que se guarda es lo mismo que se lee, incluidos requisitos y documentos', () => {
    // Si el mapper olvidara un campo en una de las dos direcciones, la convocatoria perdería
    // sus requisitos al guardarse y ya no se podría publicar. Esta prueba lo impide.
    const original = Convocatoria.reconstituir({
      id: '11111111-1111-4111-8111-111111111111',
      codigo: 'POS-2026-001',
      titulo: 'Maestrías 2026',
      descripcion: 'Posgrados en el extranjero.',
      tipo: TipoBeca.POSGRADO,
      estado: EstadoConvocatoria.BORRADOR,
      cupos: 20,
      periodo: PeriodoPostulacion.crear(
        new Date('2026-10-01T00:00:00.000Z'),
        new Date('2026-11-30T00:00:00.000Z'),
      ),
      requisitos: [Requisito.TITULO_UNIVERSITARIO, Requisito.PROMEDIO_MINIMO_80],
      documentosExigidos: [TipoDocumento.DPI, TipoDocumento.TITULO_UNIVERSITARIO],
    });

    const fila = {
      ...aPersistencia(original),
      creadaEn: new Date(),
      actualizadaEn: new Date(),
    };
    const leida = aDominio(fila as Parameters<typeof aDominio>[0]);

    expect(leida.requisitos).toEqual(original.requisitos);
    expect(leida.documentosExigidos).toEqual(original.documentosExigidos);
    expect(leida.estado).toBe(original.estado);
    expect(leida.periodo.equals(original.periodo)).toBe(true);
  });

  it('un requisito desconocido en la base falla fuerte en lugar de colarse', () => {
    const fila = {
      id: 'x',
      codigo: 'X-1',
      titulo: 'X',
      descripcion: '',
      tipo: TipoBeca.UNIVERSITARIA,
      estado: EstadoConvocatoria.BORRADOR,
      cupos: 1,
      fechaApertura: new Date('2026-10-01T00:00:00.000Z'),
      fechaCierre: new Date('2026-11-01T00:00:00.000Z'),
      requisitos: ['REQUISITO_INVENTADO'],
      documentosExigidos: [],
      creadaEn: new Date(),
      actualizadaEn: new Date(),
    };

    expect(() => aDominio(fila as unknown as Parameters<typeof aDominio>[0])).toThrow(
      /REQUISITO_INVENTADO/,
    );
  });
});
