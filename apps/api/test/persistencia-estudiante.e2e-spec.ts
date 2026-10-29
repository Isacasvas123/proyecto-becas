/**
 * Prueba de integración contra PostgreSQL de verdad: `EstudiantePrismaRepositorio`.
 *
 * El promedio y el ingreso se guardan como decimal exacto y vuelven como número; el repositorio en
 * memoria no pasa por esa conversión. Esta prueba la fija, junto con el perfil incompleto (campos
 * en NULL) y el upsert por usuario.
 *
 * Necesita la base levantada: corre con `npm run test:e2e` y en el CI, no con `npm test`.
 */
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../src/shared/persistence/prisma.service';
import { Estudiante } from '../src/modules/estudiantes/domain/entities/estudiante.entity';
import { Departamento, NivelAcademico } from '../src/modules/estudiantes/domain/enums/catalogos';
import { EstudiantePrismaRepositorio } from '../src/modules/estudiantes/infrastructure/persistence/estudiante-prisma.repositorio';

describe('EstudiantePrismaRepositorio contra PostgreSQL (integración)', () => {
  let prisma: PrismaService;
  let repositorio: EstudiantePrismaRepositorio;

  const sufijo = Date.now().toString().slice(-6);
  const usuarios: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repositorio = new EstudiantePrismaRepositorio(prisma);
  });

  afterAll(async () => {
    // El perfil se borra en cascada con el usuario.
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
    await prisma.$disconnect();
  });

  const nuevoUsuario = async (): Promise<string> => {
    const id = randomUUID();
    const n = usuarios.push(id);
    await prisma.usuario.create({
      data: {
        id,
        nombreUsuario: `perfil.${sufijo}.${n}`,
        correo: `perfil.${sufijo}.${n}@prueba.gt`,
        hashPassword: 'no-se-usa-en-esta-prueba',
        rol: 'ESTUDIANTE',
        nombreCompleto: 'Estudiante De Persistencia',
        cui: `8${sufijo}${n.toString().padStart(2, '0')}01`,
      },
    });
    return id;
  };

  const completo = (usuarioId: string, promedio = 69.99): Estudiante =>
    new Estudiante(usuarioId, {
      centroEducativo: 'Universidad Mariano Gálvez',
      nivel: NivelAcademico.UNIVERSITARIO,
      promedio,
      ingresoFamiliarMensual: 3_250.5,
      dependientes: 3,
      departamento: Departamento.ALTA_VERAPAZ,
      municipio: 'Cobán',
    });

  it('la ida y vuelta no pierde ningún campo ni redondea los decimales', async () => {
    const usuarioId = await nuevoUsuario();
    await repositorio.guardar(completo(usuarioId));

    const leido = await repositorio.buscarPorUsuario(usuarioId);

    expect(leido).not.toBeNull();
    expect(leido!.centroEducativo).toBe('Universidad Mariano Gálvez');
    expect(leido!.nivel).toBe(NivelAcademico.UNIVERSITARIO);
    expect(leido!.promedio).toBe(69.99);
    expect(leido!.ingresoFamiliarMensual).toBe(3250.5);
    expect(leido!.dependientes).toBe(3);
    expect(leido!.departamento).toBe(Departamento.ALTA_VERAPAZ);
    expect(leido!.municipio).toBe('Cobán');
    expect(leido!.perfilCompleto()).toBe(true);
  });

  it('un perfil incompleto se guarda y vuelve con los mismos campos faltantes', async () => {
    const usuarioId = await nuevoUsuario();
    await repositorio.guardar(
      new Estudiante(usuarioId, {
        centroEducativo: 'Instituto Nacional',
        nivel: NivelAcademico.NIVEL_MEDIO,
        promedio: null,
        ingresoFamiliarMensual: null,
        dependientes: 0,
        departamento: null,
        municipio: null,
      }),
    );

    const leido = await repositorio.buscarPorUsuario(usuarioId);

    expect(leido!.perfilCompleto()).toBe(false);
    expect(leido!.camposFaltantes()).toEqual([
      'promedio',
      'ingreso familiar mensual',
      'departamento',
      'municipio',
    ]);
    // Cero dependientes es un dato, no un campo faltante.
    expect(leido!.dependientes).toBe(0);
  });

  it('guardar dos veces el mismo perfil actualiza la fila en lugar de duplicarla', async () => {
    const usuarioId = await nuevoUsuario();
    await repositorio.guardar(completo(usuarioId, 70));
    await repositorio.guardar(completo(usuarioId, 85.5));

    expect(await prisma.estudiante.count({ where: { usuarioId } })).toBe(1);
    expect((await repositorio.buscarPorUsuario(usuarioId))!.promedio).toBe(85.5);
  });

  it('buscarPorUsuarios trae solo los perfiles que existen', async () => {
    const conPerfil = await nuevoUsuario();
    const sinPerfil = await nuevoUsuario();
    await repositorio.guardar(completo(conPerfil));

    const encontrados = await repositorio.buscarPorUsuarios([conPerfil, sinPerfil]);

    expect(encontrados.map((e) => e.usuarioId)).toEqual([conPerfil]);
    expect(await repositorio.buscarPorUsuarios([])).toEqual([]);
  });

  it('un usuario sin perfil devuelve null', async () => {
    expect(await repositorio.buscarPorUsuario(randomUUID())).toBeNull();
  });
});
