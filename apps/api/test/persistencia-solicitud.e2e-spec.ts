/**
 * Prueba de integración contra PostgreSQL de verdad: `SolicitudPrismaRepositorio`.
 *
 * Las demás pruebas usan repositorios en memoria, a propósito: demuestran que el dominio no
 * depende de la base (docs/05-arquitectura.md). Pero dejan un hueco que ya costó dos defectos:
 *
 *   1. `ComitePrismaRepositorio.guardar` solo agregaba integrantes y nunca quitaba los removidos.
 *   2. `SolicitudPrismaRepositorio` nunca escribía `montoBeca`: la solicitud nacía con el cero de
 *      la columna, `necesitaSegundaAprobacion()` era siempre falso y la doble aprobación de
 *      US-033 no ocurría en ningún entorno desplegado. Lo encontró una persona siguiendo la guía
 *      de verificación en Staging, no las 650 pruebas automáticas.
 *
 * Son el mismo defecto: un campo que la entidad tiene y el adaptador olvida. Un repositorio en
 * memoria guarda el objeto entero y no puede detectarlo; solo lo ve una ida y vuelta por la base.
 *
 * No comprueba un campo sino que no se pierda ninguno: compara la entidad reconstruida contra la
 * original, atributo por atributo, para cubrir también el próximo campo que se olvide mapear.
 *
 * Necesita la base levantada: corre con `npm run test:e2e` y `npm run test:cov`, y no con
 * `npm test`, que debe funcionar sin PostgreSQL.
 */
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../src/shared/persistence/prisma.service';
import { Solicitud } from '../src/modules/solicitudes/domain/entities/solicitud.entity';
import { SolicitudPrismaRepositorio } from '../src/modules/solicitudes/infrastructure/persistence/solicitud-prisma.repositorio';

const MONTO_ALTO = 15_000;

describe('SolicitudPrismaRepositorio contra PostgreSQL (integración)', () => {
  let prisma: PrismaService;
  let repositorio: SolicitudPrismaRepositorio;

  /** Ids de lo que esta prueba crea, para dejar la base como estaba. */
  const creados = { estudianteId: '', convocatoriaId: '', usuarioId: '' };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repositorio = new SolicitudPrismaRepositorio(prisma);

    // Una solicitud no puede existir sin su estudiante y su convocatoria: hay claves foráneas.
    creados.usuarioId = randomUUID();
    creados.estudianteId = randomUUID();
    creados.convocatoriaId = randomUUID();
    const sufijo = Date.now().toString().slice(-6);

    await prisma.usuario.create({
      data: {
        id: creados.usuarioId,
        nombreUsuario: `persistencia.${sufijo}`,
        correo: `persistencia.${sufijo}@prueba.gt`,
        hashPassword: 'no-se-usa-en-esta-prueba',
        rol: 'ESTUDIANTE',
        activo: true,
        nombreCompleto: 'Estudiante De Persistencia',
        cui: `9${sufijo}0101`,
      },
    });

    await prisma.estudiante.create({
      data: { id: creados.estudianteId, usuarioId: creados.usuarioId },
    });

    await prisma.convocatoria.create({
      data: {
        id: creados.convocatoriaId,
        codigo: `PERS-2026-${sufijo}`,
        titulo: 'Convocatoria de la prueba de persistencia',
        descripcion: 'Creada y borrada por persistencia-solicitud.e2e-spec.ts.',
        tipo: 'UNIVERSITARIA',
        estado: 'PUBLICADA',
        cupos: 5,
        montoBeca: MONTO_ALTO,
        fechaApertura: new Date('2026-01-01T00:00:00Z'),
        fechaCierre: new Date('2099-12-31T00:00:00Z'),
        requisitos: ['NACIONALIDAD_GUATEMALTECA'],
        documentosExigidos: ['DPI'],
      },
    });
  });

  afterAll(async () => {
    // En cascada: solicitudes, historial y documentos cuelgan de estas dos filas.
    await prisma.solicitud.deleteMany({ where: { convocatoriaId: creados.convocatoriaId } });
    await prisma.convocatoria.delete({ where: { id: creados.convocatoriaId } });
    await prisma.estudiante.delete({ where: { id: creados.estudianteId } });
    await prisma.usuario.delete({ where: { id: creados.usuarioId } });
    await prisma.$disconnect();
  });

  /** Una solicitud recién creada, con el monto de una beca que exige dos aprobaciones. */
  const nueva = (): Solicitud =>
    Solicitud.nueva({
      id: randomUUID(),
      numero: `SOL-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
      estudianteId: creados.usuarioId,
      convocatoriaId: creados.convocatoriaId,
      documentosExigidos: ['DPI'],
      montoBeca: MONTO_ALTO,
      ahora: new Date('2026-10-22T03:00:00Z'),
    });

  it('la ida y vuelta por la base no pierde ningún atributo', async () => {
    const original = nueva();

    await repositorio.guardar(original);
    const recuperada = await repositorio.buscarPorId(original.id);

    expect(recuperada).not.toBeNull();
    // Comparación atributo por atributo, no de un campo concreto: así esta prueba también
    // protege a los campos que todavía no existen.
    expect({
      id: recuperada!.id,
      numero: recuperada!.numero,
      estudianteId: recuperada!.estudianteId,
      convocatoriaId: recuperada!.convocatoriaId,
      estado: recuperada!.nombreEstado,
      montoBeca: recuperada!.montoBeca,
      documentosExigidos: [...recuperada!.documentosExigidos],
      enviadaEn: recuperada!.enviadaEn,
    }).toEqual({
      id: original.id,
      numero: original.numero,
      estudianteId: original.estudianteId,
      convocatoriaId: original.convocatoriaId,
      estado: original.nombreEstado,
      montoBeca: original.montoBeca,
      documentosExigidos: [...original.documentosExigidos],
      enviadaEn: original.enviadaEn,
    });
  });

  /**
   * El defecto exacto que se escapó a Staging, escrito como prueba: una beca de Q15,000 que
   * vuelve de la base tiene que seguir exigiendo la segunda firma.
   */
  it('una beca por encima del umbral sigue exigiendo segunda aprobación al releerla', async () => {
    const original = nueva();
    expect(original.necesitaSegundaAprobacion()).toBe(true);

    await repositorio.guardar(original);
    const recuperada = await repositorio.buscarPorId(original.id);

    expect(recuperada!.montoBeca).toBe(MONTO_ALTO);
    expect(recuperada!.necesitaSegundaAprobacion()).toBe(true);
  });

  it('el historial inicial también sobrevive a la ida y vuelta', async () => {
    const original = nueva();

    await repositorio.guardar(original);
    const recuperada = await repositorio.buscarPorId(original.id);

    expect(recuperada!.listaHistorial()).toHaveLength(1);
    expect(recuperada!.listaHistorial()[0]).toMatchObject({ desde: null, hacia: 'BORRADOR' });
  });
});
