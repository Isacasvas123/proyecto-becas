/**
 * CAPA: infrastructure/persistence/  ·  DOBLE DE PRUEBA
 * ────────────────────────────────────────────────────────────────────────────────
 * Segunda implementación del MISMO puerto, esta vez sobre un arreglo en memoria.
 *
 * POR QUÉ EXISTE
 *   Es la demostración práctica de que la inversión de dependencias funciona: el servicio
 *   de aplicación no distingue esta implementación de la de Prisma, así que las pruebas
 *   unitarias corren sin Docker, sin PostgreSQL y sin red. Ese es el argumento de
 *   testeabilidad de docs/05-arquitectura.md §2.2, aquí demostrado y no solo afirmado.
 *
 *   Es también una comprobación del principio de sustitución de Liskov (SOLID · L): las
 *   dos implementaciones respetan el mismo contrato y son intercambiables.
 *
 * POR QUÉ ESTÁ EN src/ Y NO EN test/
 *   Porque es un adaptador legítimo, igual que `AlmacenamientoMemoriaAdapter` en
 *   docs/06-patrones.md §3. Además de las pruebas unitarias, lo usan las pruebas e2e para
 *   ejercitar la ruta HTTP completa sin base de datos.
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
