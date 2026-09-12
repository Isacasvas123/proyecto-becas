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
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
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
    requisitos: [Requisito.PROMEDIO_MINIMO_75],
    documentosExigidos: [TipoDocumento.DPI],
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

  it('ordena aunque el repositorio devuelva las convocatorias desordenadas', async () => {
    // La prueba de arriba no demuestra que ORDENE EL SERVICIO: el repositorio en memoria ya
    // ordena por su cuenta, así que pasaría igual con un servicio que no ordenara nada.
    // Señalado por Fernando en la revisión del PR #1.
    //
    // Este doble devuelve a propósito el orden inverso al esperado. Si el servicio dejara de
    // ordenar, esta prueba —y solo esta— se pondría roja.
    const repositorioDesordenado = {
      buscarPublicadasVigentes: async (): Promise<Convocatoria[]> => [
        convocatoria('TARDE', EstadoConvocatoria.PUBLICADA, '2026-12-31T00:00:00.000Z'),
        convocatoria('MEDIO', EstadoConvocatoria.PUBLICADA, '2026-11-15T00:00:00.000Z'),
        convocatoria('PRONTO', EstadoConvocatoria.PUBLICADA, '2026-09-20T00:00:00.000Z'),
      ],
    };

    const modulo = await Test.createTestingModule({
      providers: [
        ListarConvocatoriasPublicadasService,
        { provide: CONVOCATORIA_REPOSITORIO, useValue: repositorioDesordenado },
      ],
    }).compile();

    const resultado = await modulo.get(ListarConvocatoriasPublicadasService).ejecutar(AHORA);

    expect(resultado.map((c) => c.codigo)).toEqual(['PRONTO', 'MEDIO', 'TARDE']);
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
      'documentosExigidos',
      'estado',
      'fechaApertura',
      'fechaCierre',
      'id',
      'requisitos',
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

  it('avisa por el log cuando el repositorio devuelve algo que no debía', async () => {
    // La prueba anterior recorre esta rama pero no comprueba el aviso, así que el día que
    // alguien borre el `logger.warn` nada se pondría rojo. El aviso ES la funcionalidad:
    // es lo único que delataría un adaptador con el `WHERE` mal escrito en producción.
    // Señalado por Fernando en la revisión del PR #1.
    const aviso = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const repositorioDefectuoso = {
      buscarPublicadasVigentes: async (): Promise<Convocatoria[]> => [
        convocatoria('FUGA-1', EstadoConvocatoria.BORRADOR, '2026-10-31T00:00:00.000Z'),
        convocatoria('FUGA-2', EstadoConvocatoria.CERRADA, '2026-10-31T00:00:00.000Z'),
        convocatoria('LEGITIMA', EstadoConvocatoria.PUBLICADA, '2026-10-31T00:00:00.000Z'),
      ],
    };

    const modulo = await Test.createTestingModule({
      providers: [
        ListarConvocatoriasPublicadasService,
        { provide: CONVOCATORIA_REPOSITORIO, useValue: repositorioDefectuoso },
      ],
    }).compile();

    const resultado = await modulo.get(ListarConvocatoriasPublicadasService).ejecutar(AHORA);

    expect(resultado.map((c) => c.codigo)).toEqual(['LEGITIMA']);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(aviso.mock.calls[0][0]).toContain('2 convocatoria(s)');

    aviso.mockRestore();
  });

  it('no ensucia el log cuando el repositorio se comporta', async () => {
    const aviso = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const servicio = await crearServicio([
      convocatoria('VIGENTE', EstadoConvocatoria.PUBLICADA, '2026-10-31T00:00:00.000Z'),
    ]);

    await servicio.ejecutar(AHORA);

    expect(aviso).not.toHaveBeenCalled();

    aviso.mockRestore();
  });
});
