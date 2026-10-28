/**
 * Segunda implementación del mismo puerto, sobre un arreglo en memoria.
 *
 * Demuestra que la inversión de dependencias funciona: el servicio no distingue esta de la de
 * Prisma, así que las pruebas corren sin Docker, sin PostgreSQL y sin red (argumento de
 * testeabilidad de docs/05-arquitectura.md §2.2). Las dos respetan el mismo contrato, como pide
 * el principio de sustitución de Liskov (SOLID · L).
 *
 * Está en `src/` y no en `test/` porque es un adaptador legítimo, como
 * `AlmacenamientoMemoriaAdapter` (docs/06-patrones.md §3), y también lo usan las pruebas e2e.
 */
import { Convocatoria } from '../../domain/entities/convocatoria.entity';
import { ConvocatoriaRepositorio } from '../../domain/ports/convocatoria.repositorio';

export class ConvocatoriaEnMemoriaRepositorio implements ConvocatoriaRepositorio {
  constructor(private readonly convocatorias: Convocatoria[] = []) {}

  async buscarPublicadasVigentes(ahora: Date): Promise<Convocatoria[]> {
    // El adaptador de Prisma delega este filtro a SQL; aquí se resuelve en memoria.
    // Distinto mecanismo, mismo contrato observable: eso es lo que se está probando.
    return this.convocatorias
      .filter((convocatoria) => convocatoria.esVisiblePublicamente(ahora))
      .sort((a, b) => a.periodo.cierre.getTime() - b.periodo.cierre.getTime());
  }

  async buscarTodas(): Promise<Convocatoria[]> {
    return [...this.convocatorias].reverse();
  }

  async buscarPorId(id: string): Promise<Convocatoria | null> {
    return this.convocatorias.find((convocatoria) => convocatoria.id === id) ?? null;
  }

  async guardar(convocatoria: Convocatoria): Promise<void> {
    const indice = this.convocatorias.findIndex((existente) => existente.id === convocatoria.id);
    if (indice >= 0) {
      this.convocatorias[indice] = convocatoria;
    } else {
      this.convocatorias.push(convocatoria);
    }
  }

  async contarConPrefijoDeCodigo(prefijo: string): Promise<number> {
    return this.convocatorias.filter((convocatoria) => convocatoria.codigo.startsWith(prefijo))
      .length;
  }
}
