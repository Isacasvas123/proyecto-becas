/**
 * Prueba de integración contra PostgreSQL de verdad: `ConvocatoriaPrismaRepositorio` (DEF-01).
 *
 * Las demás pruebas de convocatorias usan el repositorio en memoria, que guarda el objeto entero
 * y no puede perder un campo. Esta hace la ida y vuelta por la base real, como
 * `persistencia-solicitud.e2e-spec.ts`, y fija también el filtro del listado público, que se hace
 * en SQL y no en memoria.
 *
 * Necesita la base levantada: corre con `npm run test:e2e` y en el CI, no con `npm test`.
 */
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../src/shared/persistence/prisma.service';
import { Convocatoria } from '../src/modules/convocatorias/domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../src/modules/convocatorias/domain/enums/estado-convocatoria.enum';
import { Requisito } from '../src/modules/convocatorias/domain/enums/requisito.enum';
import { TipoBeca } from '../src/modules/convocatorias/domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../src/modules/convocatorias/domain/enums/tipo-documento.enum';
import { PeriodoPostulacion } from '../src/modules/convocatorias/domain/value-objects/periodo-postulacion.vo';
import { ConvocatoriaPrismaRepositorio } from '../src/modules/convocatorias/infrastructure/persistence/convocatoria-prisma.repositorio';

describe('ConvocatoriaPrismaRepositorio contra PostgreSQL (integración)', () => {
  let prisma: PrismaService;
  let repositorio: ConvocatoriaPrismaRepositorio;

  /** Prefijo propio de esta corrida, para no chocar con otros datos y poder limpiar. */
  const prefijo = `DEF01-${Date.now().toString().slice(-6)}-`;
  const creadas: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repositorio = new ConvocatoriaPrismaRepositorio(prisma);
  });

  afterAll(async () => {
    await prisma.convocatoria.deleteMany({ where: { id: { in: creadas } } });
    await prisma.$disconnect();
  });

  const nueva = (cierre = new Date('2099-12-31T00:00:00Z')): Convocatoria => {
    const id = randomUUID();
    creadas.push(id);
    return Convocatoria.nuevaEnBorrador({
      id,
      codigo: `${prefijo}${creadas.length}`,
      titulo: 'Convocatoria de la prueba de persistencia',
      descripcion: 'Creada y borrada por persistencia-convocatoria.e2e-spec.ts.',
      tipo: TipoBeca.UNIVERSITARIA,
      cupos: 7,
      montoBeca: 15_000,
      periodo: PeriodoPostulacion.crear(new Date('2026-01-01T00:00:00Z'), cierre),
      requisitos: [Requisito.NACIONALIDAD_GUATEMALTECA],
      documentosExigidos: [TipoDocumento.DPI],
    });
  };

  it('la ida y vuelta por la base no pierde ningún atributo', async () => {
    const original = nueva();

    await repositorio.guardar(original);
    const recuperada = await repositorio.buscarPorId(original.id);

    expect(recuperada).not.toBeNull();
    expect({
      id: recuperada!.id,
      codigo: recuperada!.codigo,
      titulo: recuperada!.titulo,
      descripcion: recuperada!.descripcion,
      tipo: recuperada!.tipo,
      estado: recuperada!.estado,
      cupos: recuperada!.cupos,
      montoBeca: recuperada!.montoBeca,
      apertura: recuperada!.periodo.apertura.toISOString(),
      cierre: recuperada!.periodo.cierre.toISOString(),
      requisitos: [...recuperada!.requisitos],
      documentosExigidos: [...recuperada!.documentosExigidos],
    }).toEqual({
      id: original.id,
      codigo: original.codigo,
      titulo: original.titulo,
      descripcion: original.descripcion,
      tipo: original.tipo,
      estado: original.estado,
      cupos: original.cupos,
      montoBeca: original.montoBeca,
      apertura: original.periodo.apertura.toISOString(),
      cierre: original.periodo.cierre.toISOString(),
      requisitos: [...original.requisitos],
      documentosExigidos: [...original.documentosExigidos],
    });
  });

  it('guardar de nuevo actualiza la fila en lugar de duplicarla', async () => {
    const convocatoria = nueva();
    await repositorio.guardar(convocatoria);

    convocatoria.publicar();
    await repositorio.guardar(convocatoria);

    const recuperada = await repositorio.buscarPorId(convocatoria.id);
    expect(recuperada!.estado).toBe(EstadoConvocatoria.PUBLICADA);
    expect(await prisma.convocatoria.count({ where: { id: convocatoria.id } })).toBe(1);
  });

  it('el listado público trae las publicadas vigentes y deja fuera borradores y vencidas', async () => {
    const publicada = nueva();
    publicada.publicar();
    const borrador = nueva();
    const vencida = nueva(new Date('2026-02-01T00:00:00Z'));
    vencida.publicar();
    for (const c of [publicada, borrador, vencida]) await repositorio.guardar(c);

    const ids = (await repositorio.buscarPublicadasVigentes(new Date('2026-06-01T00:00:00Z'))).map(
      (c) => c.id,
    );

    expect(ids).toContain(publicada.id);
    expect(ids).not.toContain(borrador.id);
    expect(ids).not.toContain(vencida.id);
  });

  it('cuenta las convocatorias por prefijo de código', async () => {
    const antes = await repositorio.contarConPrefijoDeCodigo(prefijo);
    await repositorio.guardar(nueva());

    expect(await repositorio.contarConPrefijoDeCodigo(prefijo)).toBe(antes + 1);
  });

  it('una convocatoria que no existe devuelve null', async () => {
    expect(await repositorio.buscarPorId(randomUUID())).toBeNull();
  });
});
