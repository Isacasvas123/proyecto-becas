/**
 * CAPA: infrastructure/persistence/
 *
 * Traduce la FILA de PostgreSQL a la ENTIDAD de dominio.
 *
 * Este archivo es el único del módulo que conoce a la vez las dos formas del mismo
 * concepto. Es la frontera exacta donde se detiene el ORM: a partir de aquí hacia arriba
 * el sistema solo maneja `Convocatoria`, no `Prisma.Convocatoria`.
 *
 * Es también el archivo que protege al proyecto si algún día se cambia de ORM o si el
 * esquema de la base de datos evoluciona sin que el negocio cambie.
 */
import { Convocatoria as ConvocatoriaPrisma } from '@prisma/client';

import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { PeriodoPostulacion } from '../../domain/value-objects/periodo-postulacion.vo';

export function aDominio(fila: ConvocatoriaPrisma): Convocatoria {
  return Convocatoria.reconstituir({
    id: fila.id,
    codigo: fila.codigo,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    // Los enums de Prisma y los del dominio son tipos distintos aunque compartan valores.
    // La conversión explícita es intencional: deja constancia de que son dos vocabularios
    // separados y de que este es el único punto donde se cruzan.
    tipo: fila.tipo as TipoBeca,
    estado: fila.estado as EstadoConvocatoria,
    cupos: fila.cupos,
    periodo: PeriodoPostulacion.crear(fila.fechaApertura, fila.fechaCierre),
  });
}
