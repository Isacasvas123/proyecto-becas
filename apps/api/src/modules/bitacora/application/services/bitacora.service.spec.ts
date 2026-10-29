/**
 * Prueba unitaria — bitácora (exigencia del PO del 17 de octubre de 2026).
 *
 * Lo que se fija aquí es la decisión de diseño que más fácil se rompe al refactorizar: que un
 * fallo al auditar NO tumbe la operación del usuario, y que la consulta no se pueda usar para
 * traerse la bitácora entera de un tirón.
 */
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { RegistroBitacora } from '../../domain/entities/registro-bitacora.entity';
import {
  BitacoraRepositorio,
  FiltroBitacora,
  PaginaBitacora,
} from '../../domain/ports/bitacora.repositorio';
import { BitacoraService } from './bitacora.service';

const AHORA = new Date('2026-10-17T15:00:00.000Z');

function registro(sobre: Partial<{ resultado: number; accion: string }> = {}): RegistroBitacora {
  return new RegistroBitacora({
    actor: { id: 'u-1', nombreUsuario: 'admin', rol: RolUsuario.ADMINISTRADOR },
    accion: sobre.accion ?? 'POST /convocatorias',
    entidad: 'convocatorias',
    entidadId: null,
    resultado: sobre.resultado ?? 201,
    origen: '127.0.0.1',
    ocurridoEn: AHORA,
  });
}

class RepositorioFalso implements BitacoraRepositorio {
  readonly escritos: RegistroBitacora[] = [];
  filtroRecibido: FiltroBitacora | null = null;
  fallaAlEscribir = false;
  total = 0;

  registrar(r: RegistroBitacora): Promise<void> {
    if (this.fallaAlEscribir) return Promise.reject(new Error('BD caída'));
    this.escritos.push(r);
    return Promise.resolve();
  }

  consultar(filtro: FiltroBitacora): Promise<PaginaBitacora> {
    this.filtroRecibido = filtro;
    return Promise.resolve({ registros: [registro()], total: this.total });
  }

  entidades(): Promise<string[]> {
    return Promise.resolve(['convocatorias', 'solicitudes']);
  }
}

describe('BitacoraService', () => {
  let repositorio: RepositorioFalso;
  let servicio: BitacoraService;

  beforeEach(() => {
    repositorio = new RepositorioFalso();
    servicio = new BitacoraService(repositorio);
  });

  it('escribe el asiento tal como llega', async () => {
    await servicio.registrar(registro({ accion: 'DELETE /comites/:id/evaluadores/:id' }));

    expect(repositorio.escritos).toHaveLength(1);
    expect(repositorio.escritos[0].accion).toBe('DELETE /comites/:id/evaluadores/:id');
  });

  it('si la bitácora falla, NO propaga el error: la acción del usuario ya ocurrió', async () => {
    repositorio.fallaAlEscribir = true;

    await expect(servicio.registrar(registro())).resolves.toBeUndefined();
  });

  it('acota el tamaño de página a 100 aunque pidan más', async () => {
    await servicio.consultar({ pagina: 1, porPagina: 5000 });

    expect(repositorio.filtroRecibido?.porPagina).toBe(100);
  });

  it('corrige una página o un tamaño fuera de rango en vez de fallar', async () => {
    await servicio.consultar({ pagina: 0, porPagina: 0 });

    expect(repositorio.filtroRecibido).toMatchObject({ pagina: 1, porPagina: 1 });
  });

  it('calcula cuántas páginas hay', async () => {
    repositorio.total = 101;

    const pagina = await servicio.consultar({ pagina: 1, porPagina: 50 });

    expect(pagina).toMatchObject({ total: 101, porPagina: 50, paginas: 3 });
  });

  it('sin registros, sigue habiendo una página', async () => {
    repositorio.total = 0;

    expect((await servicio.consultar({ pagina: 1, porPagina: 50 })).paginas).toBe(1);
  });

  it('el DTO lleva el usuario y el rol, nunca el identificador interno', async () => {
    repositorio.total = 1;

    const { registros } = await servicio.consultar({ pagina: 1, porPagina: 50 });

    expect(registros[0]).toEqual({
      actor: 'admin',
      rol: RolUsuario.ADMINISTRADOR,
      accion: 'POST /convocatorias',
      entidad: 'convocatorias',
      entidadId: null,
      resultado: 201,
      rechazada: false,
      origen: '127.0.0.1',
      ocurridoEn: AHORA.toISOString(),
    });
    expect(JSON.stringify(registros[0])).not.toContain('u-1');
  });

  it('marca como rechazadas las peticiones con código 400 o mayor', () => {
    expect(registro({ resultado: 200 }).fueRechazada).toBe(false);
    expect(registro({ resultado: 403 }).fueRechazada).toBe(true);
    expect(registro({ resultado: 500 }).fueRechazada).toBe(true);
  });

  it('un asiento no se puede modificar después de creado', () => {
    const r = registro();

    expect(() => {
      (r as { accion: string }).accion = 'otra cosa';
    }).toThrow();
  });
});
