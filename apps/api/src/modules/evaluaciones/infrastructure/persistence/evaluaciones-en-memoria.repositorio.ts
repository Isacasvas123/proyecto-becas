/** Dobles para pruebas: mismos contratos que los adaptadores de Prisma. */
import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { Asignacion, Comite } from '../../domain/entities/comite.entity';
import { Dictamen } from '../../domain/entities/dictamen.entity';
import { ComiteRepositorio } from '../../domain/ports/comite.repositorio';
import { DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';

export class ComiteEnMemoriaRepositorio implements ComiteRepositorio {
  private readonly comites = new Map<string, Comite>();
  readonly asignaciones: Asignacion[] = [];

  buscarPorId(id: string): Promise<Comite | null> {
    return Promise.resolve(this.comites.get(id) ?? null);
  }

  buscarPorConvocatoria(convocatoriaId: string): Promise<Comite | null> {
    return Promise.resolve(
      [...this.comites.values()].find((c) => c.convocatoriaId === convocatoriaId) ?? null,
    );
  }

  listar(): Promise<Comite[]> {
    return Promise.resolve(
      [...this.comites.values()].sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime()),
    );
  }

  guardar(comite: Comite): Promise<void> {
    const otro = [...this.comites.values()].find(
      (c) => c.convocatoriaId === comite.convocatoriaId && c.id !== comite.id,
    );
    if (otro !== undefined) {
      return Promise.reject(new RecursoDuplicadoError('Esa convocatoria ya tiene un comité.'));
    }
    this.comites.set(comite.id, comite);
    return Promise.resolve();
  }

  guardarAsignaciones(nuevas: readonly Asignacion[]): Promise<void> {
    for (const a of nuevas) {
      const existe = this.asignaciones.some(
        (x) => x.solicitudId === a.solicitudId && x.evaluadorId === a.evaluadorId,
      );
      if (!existe) this.asignaciones.push(a);
    }
    return Promise.resolve();
  }

  eliminarAsignaciones(
    comiteId: string,
    evaluadorId: string,
    solicitudIds: readonly string[],
  ): Promise<void> {
    const objetivo = new Set(solicitudIds);
    for (let i = this.asignaciones.length - 1; i >= 0; i -= 1) {
      const a = this.asignaciones[i];
      if (a.comiteId === comiteId && a.evaluadorId === evaluadorId && objetivo.has(a.solicitudId)) {
        this.asignaciones.splice(i, 1);
      }
    }
    return Promise.resolve();
  }

  asignacionesDeComite(comiteId: string): Promise<Asignacion[]> {
    return Promise.resolve(this.asignaciones.filter((a) => a.comiteId === comiteId));
  }

  asignacionesDeEvaluador(evaluadorId: string): Promise<Asignacion[]> {
    return Promise.resolve(this.asignaciones.filter((a) => a.evaluadorId === evaluadorId));
  }

  estaAsignada(solicitudId: string, evaluadorId: string): Promise<boolean> {
    return Promise.resolve(
      this.asignaciones.some((a) => a.solicitudId === solicitudId && a.evaluadorId === evaluadorId),
    );
  }
}

export class DictamenEnMemoriaRepositorio implements DictamenRepositorio {
  readonly dictamenes: Dictamen[] = [];

  crear(dictamen: Dictamen): Promise<void> {
    const repetido = this.dictamenes.some(
      (d) => d.solicitudId === dictamen.solicitudId && d.evaluadorId === dictamen.evaluadorId,
    );
    if (repetido) {
      return Promise.reject(new RecursoDuplicadoError('Ese dictamen ya fue emitido.'));
    }
    this.dictamenes.push(dictamen);
    return Promise.resolve();
  }

  buscar(solicitudId: string, evaluadorId: string): Promise<Dictamen | null> {
    return Promise.resolve(
      this.dictamenes.find((d) => d.solicitudId === solicitudId && d.evaluadorId === evaluadorId) ??
        null,
    );
  }

  deSolicitudes(ids: readonly string[]): Promise<Dictamen[]> {
    return Promise.resolve(this.dictamenes.filter((d) => ids.includes(d.solicitudId)));
  }

  deEvaluador(evaluadorId: string): Promise<Dictamen[]> {
    return Promise.resolve(this.dictamenes.filter((d) => d.evaluadorId === evaluadorId));
  }
}
