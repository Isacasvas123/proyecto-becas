/**
 * PRUEBAS DEL SERVICIO DE APLICACIÓN.
 *
 * Al servicio se le inyecta `ConvocatoriaEnMemoriaRepositorio` en lugar del repositorio
 * de Prisma. Es el mismo puerto, así que el servicio no nota la diferencia: por eso estas
 * pruebas corren sin Docker, sin PostgreSQL y sin red.
 *
 * Se usa `Test.createTestingModule` de NestJS —y no un simple `new Servicio(...)`— para
 * verificar de paso que el ENLACE del token de inyección está bien hecho. Si alguien
 * rompe el `provide: CONVOCATORIA_REPOSITORIO`, esta prueba lo detecta.
 */
import { Test, TestingModule } from '@nestjs/testing';

import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { CONVOCATORIA_REPOSITORIO } from '../../domain/ports/convocatoria.repositorio';
import { PeriodoPostulacion } from '../../domain/value-objects/periodo-postulacion.vo';
import { ConvocatoriaEnMemoriaRepositorio } from '../../infrastructure/persistence/convocatoria-en-memoria.repositorio';
import { ListarConvocatoriasPublicadasService } from './listar-convocatorias-publicadas.service';

const AHORA = new Date('2026-09-15T12:00:00.000Z');

function convocatoria(
  codigo: string,
  estado: EstadoConvocatoria,
  cierre: string,
  apertura = '2026-09-01T00:00:00.000Z',
): Convocatoria {
  return Convocatoria.reconstituir({
    id: `id-${codigo}`,
    codigo,
    titulo: `Convocatoria ${codigo}`,
    descripcion: 'Descripción de prueba.',
    tipo: TipoBeca.UNIVERSITARIA,
    estado,
    cupos: 100,
    periodo: PeriodoPostulacion.crear(new Date(apertura), new Date(cierre)),
  });
}

async function crearServicio(datos: Convocatoria[]): Promise<ListarConvocatoriasPublicadasService> {
  const modulo: TestingModule = await Test.createTestingModule({
    providers: [
      ListarConvocatoriasPublicadasService,
      {
        provide: CONVOCATORIA_REPOSITORIO,
        useValue: new ConvocatoriaEnMemoriaRepositorio(datos),
      },
    ],
  }).compile();

  return modulo.get(ListarConvocatoriasPublicadasService);
}

describe('ListarConvocatoriasPublicadasService', () => {
  it('devuelve una lista vacía cuando no hay convocatorias', async () => {
    const servicio = await crearServicio([]);

    await expect(servicio.ejecutar(AHORA)).resolves.toEqual([]);
  });

  it('devuelve solo las convocatorias PUBLICADAS y vigentes (US-008)', async () => {
    const servicio = await crearServicio([
      convocatoria('VIGENTE', EstadoConvocatoria.PUBLICADA, '2026-10-31T00:00:00.000Z'),
      convocatoria('BORRADOR', EstadoConvocatoria.BORRADOR, '2026-10-31T00:00:00.000Z'),
      convocatoria('CERRADA', EstadoConvocatoria.CERRADA, '2026-10-31T00:00:00.000Z'),
      convocatoria('VENCIDA', EstadoConvocatoria.PUBLICADA, '2026-09-10T00:00:00.000Z'),
    ]);

    const resultado = await servicio.ejecutar(AHORA);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].codigo).toBe('VIGENTE');
  });

  it('ordena las convocatorias por fecha de cierre más próxima', async () => {
    const servicio = await crearServicio([
      convocatoria('TARDE', EstadoConvocatoria.PUBLICADA, '2026-12-31T00:00:00.000Z'),
      convocatoria('PRONTO', EstadoConvocatoria.PUBLICADA, '2026-09-20T00:00:00.000Z'),
    ]);

    const resultado = await servicio.ejecutar(AHORA);

    expect(resultado.map((c) => c.codigo)).toEqual(['PRONTO', 'TARDE']);
  });

  it('devuelve DTOs planos, no entidades de dominio', async () => {
    const servicio = await crearServicio([
      convocatoria('VIGENTE', EstadoConvocatoria.PUBLICADA, '2026-10-31T00:00:00.000Z'),
    ]);

    const [dto] = await servicio.ejecutar(AHORA);

    // El contrato hacia afuera son datos, no objetos con comportamiento: nadie fuera del
    // dominio debe poder invocar reglas de negocio sobre lo que devuelve la API.
    expect(dto).not.toBeInstanceOf(Convocatoria);
    expect(dto.fechaCierre).toBe('2026-10-31T00:00:00.000Z');
    expect(Object.keys(dto).sort()).toEqual([
      'codigo',
      'cupos',
      'descripcion',
      'estado',
      'fechaApertura',
      'fechaCierre',
      'id',
      'tipo',
      'titulo',
    ]);
  });

  it('filtra en el dominio aunque el repositorio devuelva datos que no debía', async () => {
    // Repositorio deliberadamente defectuoso: simula un adaptador con un `WHERE` mal
    // escrito. La regla de negocio vive en la entidad, así que el caso de uso se protege.
    const repositorioDefectuoso = {
      buscarPublicadasVigentes: async (): Promise<Convocatoria[]> => [
        convocatoria('FUGA', EstadoConvocatoria.BORRADOR, '2026-10-31T00:00:00.000Z'),
      ],
    };

    const modulo = await Test.createTestingModule({
      providers: [
        ListarConvocatoriasPublicadasService,
        { provide: CONVOCATORIA_REPOSITORIO, useValue: repositorioDefectuoso },
      ],
    }).compile();

    const servicio = modulo.get(ListarConvocatoriasPublicadasService);

    await expect(servicio.ejecutar(AHORA)).resolves.toEqual([]);
  });
});
