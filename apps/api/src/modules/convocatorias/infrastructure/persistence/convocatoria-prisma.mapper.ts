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
import { Convocatoria as ConvocatoriaPrisma, Prisma } from '@prisma/client';

import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
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
    montoBeca: fila.montoBeca,
    periodo: PeriodoPostulacion.crear(fila.fechaApertura, fila.fechaCierre),
    requisitos: fila.requisitos.map((valor) => enCatalogo(Requisito, valor, 'requisito')),
    documentosExigidos: fila.documentosExigidos.map((valor) =>
      enCatalogo(TipoDocumento, valor, 'documento'),
    ),
  });
}

/** Del dominio a lo que Prisma escribe. Es la otra mitad del cruce entre vocabularios. */
export function aPersistencia(convocatoria: Convocatoria): Prisma.ConvocatoriaUncheckedCreateInput {
  return {
    id: convocatoria.id,
    codigo: convocatoria.codigo,
    titulo: convocatoria.titulo,
    descripcion: convocatoria.descripcion,
    tipo: convocatoria.tipo,
    estado: convocatoria.estado,
    cupos: convocatoria.cupos,
    montoBeca: convocatoria.montoBeca,
    fechaApertura: convocatoria.periodo.apertura,
    fechaCierre: convocatoria.periodo.cierre,
    requisitos: [...convocatoria.requisitos],
    documentosExigidos: [...convocatoria.documentosExigidos],
  };
}

/**
 * Traduce un valor guardado al enum del dominio, y falla fuerte si no existe.
 *
 * Mismo criterio que `aRolDominio` en el módulo de usuarios: un valor desconocido en la base
 * es un dato corrupto o un enum desincronizado, y conviene enterarse aquí y no con un
 * `undefined` recorriendo el sistema.
 */
function enCatalogo<T extends Record<string, string>>(
  catalogo: T,
  valor: string,
  nombre: string,
): T[keyof T] {
  if (!Object.values(catalogo).includes(valor)) {
    throw new Error(`El ${nombre} "${valor}" está en la base de datos pero no en el dominio.`);
  }
  return valor as T[keyof T];
}
