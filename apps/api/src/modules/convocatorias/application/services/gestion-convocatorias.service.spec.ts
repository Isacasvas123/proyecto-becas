/**
 * PRUEBAS DE LOS CASOS DE USO DE GESTIÓN — US-006 (crear) y US-007 (publicar).
 *
 * Con el repositorio en memoria: sin Docker ni PostgreSQL. Lo que se prueba aquí es la
 * ORQUESTACIÓN —código correlativo, persistencia, "no encontrado"—, porque las reglas del
 * negocio ya tienen sus pruebas en la entidad y en la fábrica.
 */
import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { EstadoConvocatoria } from '../../domain/enums/estado-convocatoria.enum';
import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
import { FABRICAS_CONVOCATORIA } from '../../domain/factories/convocatoria.factory';
import { ConvocatoriaEnMemoriaRepositorio } from '../../infrastructure/persistence/convocatoria-en-memoria.repositorio';
import { ComandoCrearConvocatoria, CrearConvocatoriaService } from './crear-convocatoria.service';
import { ListarConvocatoriasGestionService } from './listar-convocatorias-gestion.service';
import { ObtenerCatalogoConvocatoriasService } from './obtener-catalogo-convocatorias.service';
import { PublicarConvocatoriaService } from './publicar-convocatoria.service';

function comando(cambios: Partial<ComandoCrearConvocatoria> = {}): ComandoCrearConvocatoria {
  return {
    tipo: TipoBeca.UNIVERSITARIA,
    titulo: 'Beca Universitaria 2027',
    descripcion: 'Licenciaturas en universidades del país.',
    cupos: 200,
    montoBeca: 5000,
    fechaApertura: new Date('2027-01-15T00:00:00.000Z'),
    fechaCierre: new Date('2027-03-15T00:00:00.000Z'),
    ...cambios,
  };
}

describe('Gestión de convocatorias', () => {
  let repositorio: ConvocatoriaEnMemoriaRepositorio;
  let crear: CrearConvocatoriaService;
  let publicar: PublicarConvocatoriaService;

  beforeEach(() => {
    repositorio = new ConvocatoriaEnMemoriaRepositorio([]);
    crear = new CrearConvocatoriaService(repositorio);
    publicar = new PublicarConvocatoriaService(repositorio);
  });

  describe('CrearConvocatoriaService (US-006)', () => {
    it('crea la convocatoria en BORRADOR y la persiste', async () => {
      const creada = await crear.ejecutar(comando());

      expect(creada.estado).toBe(EstadoConvocatoria.BORRADOR);
      await expect(repositorio.buscarPorId(creada.id)).resolves.toBeInstanceOf(Convocatoria);
    });

    it('asigna un id con formato UUID', async () => {
      const creada = await crear.ejecutar(comando());

      expect(creada.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it('genera códigos correlativos por tipo y año de apertura', async () => {
      const primera = await crear.ejecutar(comando());
      const segunda = await crear.ejecutar(comando());
      const posgrado = await crear.ejecutar(comando({ tipo: TipoBeca.POSGRADO, cupos: 10 }));

      expect(primera.codigo).toBe('UNIV-2027-001');
      expect(segunda.codigo).toBe('UNIV-2027-002');
      // Otro tipo lleva su propio correlativo: no continúa la numeración de universitaria.
      expect(posgrado.codigo).toBe('POS-2027-001');
    });

    it('el año del código es el de APERTURA, no el de hoy', async () => {
      // Una beca del ciclo 2028 creada con antelación pertenece al 2028.
      const creada = await crear.ejecutar(
        comando({
          fechaApertura: new Date('2028-02-01T00:00:00.000Z'),
          fechaCierre: new Date('2028-04-01T00:00:00.000Z'),
        }),
      );

      expect(creada.codigo).toBe('UNIV-2028-001');
    });

    it('sin requisitos indicados, devuelve los del tipo con su descripción legible', async () => {
      const creada = await crear.ejecutar(comando({ tipo: TipoBeca.POSGRADO, cupos: 10 }));

      expect(creada.requisitos.map((r) => r.codigo)).toEqual(
        FABRICAS_CONVOCATORIA[TipoBeca.POSGRADO].requisitosPorDefecto(),
      );
      expect(creada.requisitos[0].descripcion).toEqual(expect.any(String));
      expect(creada.requisitos[0].descripcion.length).toBeGreaterThan(0);
    });

    it('si la fábrica rechaza los datos, no se guarda nada', async () => {
      await expect(
        crear.ejecutar(comando({ tipo: TipoBeca.POSGRADO, cupos: 500 })),
      ).rejects.toThrow();

      await expect(repositorio.buscarTodas()).resolves.toHaveLength(0);
    });

    it('no contiene lógica por tipo: la delega en la fábrica', async () => {
      // Si alguien metiera un `if (tipo === ...)` en el servicio, esta prueba seguiría pasando.
      // Lo que sí la rompería es que el servicio ignorara la fábrica; se verifica espiándola.
      const fabrica = FABRICAS_CONVOCATORIA[TipoBeca.NIVEL_MEDIO];
      const espia = jest.spyOn(fabrica, 'crear');

      await crear.ejecutar(comando({ tipo: TipoBeca.NIVEL_MEDIO }));

      expect(espia).toHaveBeenCalledTimes(1);
      espia.mockRestore();
    });
  });

  describe('PublicarConvocatoriaService (US-007)', () => {
    it('publica un borrador y persiste el nuevo estado', async () => {
      const creada = await crear.ejecutar(comando());

      const publicada = await publicar.ejecutar(creada.id);

      expect(publicada.estado).toBe(EstadoConvocatoria.PUBLICADA);
      const guardada = await repositorio.buscarPorId(creada.id);
      expect(guardada?.estado).toBe(EstadoConvocatoria.PUBLICADA);
    });

    it('lanza RecursoNoEncontradoError si el id no existe', async () => {
      await expect(publicar.ejecutar('33333333-3333-4333-8333-333333333333')).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('si la entidad rechaza la publicación, el estado guardado NO cambia', async () => {
      const creada = await crear.ejecutar(comando({ requisitos: [] }));

      await expect(publicar.ejecutar(creada.id)).rejects.toThrow();

      const guardada = await repositorio.buscarPorId(creada.id);
      expect(guardada?.estado).toBe(EstadoConvocatoria.BORRADOR);
    });

    it('recién publicada, aparece en el listado público (criterio 2)', async () => {
      const creada = await crear.ejecutar(
        comando({
          fechaApertura: new Date('2026-01-01T00:00:00.000Z'),
          fechaCierre: new Date('2099-12-31T00:00:00.000Z'),
        }),
      );
      await publicar.ejecutar(creada.id);

      const visibles = await repositorio.buscarPublicadasVigentes(new Date('2026-09-12T00:00:00Z'));

      expect(visibles.map((c) => c.id)).toContain(creada.id);
    });
  });

  describe('ListarConvocatoriasGestionService', () => {
    it('incluye los borradores, que el listado público nunca muestra', async () => {
      await crear.ejecutar(comando());

      const todas = await new ListarConvocatoriasGestionService(repositorio).ejecutar();

      expect(todas).toHaveLength(1);
      expect(todas[0].estado).toBe(EstadoConvocatoria.BORRADOR);
    });
  });

  describe('ObtenerCatalogoConvocatoriasService', () => {
    const catalogo = new ObtenerCatalogoConvocatoriasService().ejecutar();

    it('expone todo el catálogo de requisitos y documentos', () => {
      expect(catalogo.requisitos).toHaveLength(Object.values(Requisito).length);
      expect(catalogo.documentos).toHaveLength(Object.values(TipoDocumento).length);
    });

    it('los valores por defecto de cada tipo salen de las FÁBRICAS, no de una copia', () => {
      for (const { tipo, requisitosPorDefecto, documentosPorDefecto } of catalogo.tipos) {
        expect(requisitosPorDefecto).toEqual(FABRICAS_CONVOCATORIA[tipo].requisitosPorDefecto());
        expect(documentosPorDefecto).toEqual(FABRICAS_CONVOCATORIA[tipo].documentosPorDefecto());
      }
      expect(catalogo.tipos).toHaveLength(Object.values(TipoBeca).length);
    });
  });
});
