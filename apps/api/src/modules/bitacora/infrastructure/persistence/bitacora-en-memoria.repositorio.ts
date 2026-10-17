/**
 * CAPA: infrastructure/persistence/
 * ────────────────────────────────────────────────────────────────────────────────
 * Bitácora en memoria, para pruebas. Mismo criterio que el resto de repositorios en memoria del
 * proyecto: permite probar el interceptor y la consulta sin PostgreSQL.
 *
 * Tampoco aquí hay forma de modificar ni borrar un asiento: el puerto no lo permite, y un doble
 * de prueba que ofreciera más que el real serviría para probar cosas que no existen.
 */
import { RegistroBitacora } from '../../domain/entities/registro-bitacora.entity';
import {
  BitacoraRepositorio,
  FiltroBitacora,
  PaginaBitacora,
} from '../../domain/ports/bitacora.repositorio';

export class BitacoraEnMemoriaRepositorio implements BitacoraRepositorio {
  private readonly asientos: RegistroBitacora[] = [];

  registrar(registro: RegistroBitacora): Promise<void> {
    this.asientos.push(registro);
    return Promise.resolve();
  }

  consultar(filtro: FiltroBitacora): Promise<PaginaBitacora> {
    const coinciden = this.asientos.filter((r) => {
      if (filtro.actorId !== undefined && r.actor.id !== filtro.actorId) return false;
      if (filtro.rol !== undefined && r.actor.rol !== filtro.rol) return false;
      if (filtro.entidad !== undefined && r.entidad !== filtro.entidad) return false;
      if (filtro.soloRechazadas === true && !r.fueRechazada) return false;
      if (filtro.desde !== undefined && r.ocurridoEn < filtro.desde) return false;
      if (filtro.hasta !== undefined && r.ocurridoEn > filtro.hasta) return false;
      return true;
    });

    const ordenados = [...coinciden].sort(
      (a, b) => b.ocurridoEn.getTime() - a.ocurridoEn.getTime(),
    );
    const desde = (filtro.pagina - 1) * filtro.porPagina;

    return Promise.resolve({
      registros: ordenados.slice(desde, desde + filtro.porPagina),
      total: ordenados.length,
    });
  }

  entidades(): Promise<string[]> {
    const nombres = new Set<string>();
    for (const r of this.asientos) if (r.entidad !== null) nombres.add(r.entidad);
    return Promise.resolve([...nombres].sort());
  }
}
