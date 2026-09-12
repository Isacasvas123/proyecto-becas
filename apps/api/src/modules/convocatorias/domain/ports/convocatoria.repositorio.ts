/**
 * CAPA: domain/ports/  ·  ESTE ARCHIVO ES EL CORAZÓN DEL DISEÑO
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   Un PUERTO: la interfaz que declara lo que el dominio NECESITA del mundo exterior,
 *   escrita en el vocabulario del dominio. Nótese que devuelve `Convocatoria` (entidad de
 *   dominio), no filas de Prisma.
 *
 * POR QUÉ ESTÁ EN domain/ Y NO EN infrastructure/
 *   Aquí es donde se invierte la dependencia (SOLID · D). Sin esta interfaz, el servicio
 *   de aplicación dependería del repositorio Prisma: la flecha apuntaría del negocio hacia
 *   la base de datos y el ORM mandaría sobre el diseño. Con ella, la flecha se invierte:
 *
 *       application ──▶ [ ConvocatoriaRepositorio ]  ◀── infrastructure
 *                              (domain)
 *
 *   Manda el dominio. Prisma pasa a ser un detalle reemplazable, y las pruebas usan una
 *   implementación en memoria sin cambiar una línea del servicio.
 *
 * SEGREGACIÓN DE INTERFACES (SOLID · I)
 *   Un método, el que hoy se usa. No se declara un repositorio genérico con `guardar`,
 *   `eliminar` y `buscarTodo` "por si acaso": cada historia agrega el método que necesita
 *   (docs/05-arquitectura.md §2.4).
 */
import { Convocatoria } from '../entities/convocatoria.entity';

/**
 * TOKEN DE INYECCIÓN.
 *
 * Una interfaz de TypeScript desaparece al compilar, así que no puede usarse como
 * identificador en tiempo de ejecución. Este `Symbol` es la llave con la que el módulo
 * asocia el puerto (domain) con su adaptador concreto (infrastructure).
 *
 * Es un `Symbol` de JavaScript puro: declararlo aquí NO viola la pureza del dominio,
 * porque no arrastra ninguna dependencia de framework.
 */
export const CONVOCATORIA_REPOSITORIO = Symbol('ConvocatoriaRepositorio');

export interface ConvocatoriaRepositorio {
  /**
   * Devuelve las convocatorias publicadas y aún vigentes en la fecha indicada (US-008).
   *
   * `ahora` viaja como parámetro para que el criterio temporal lo fije quien orquesta el
   * caso de uso, y no cada adaptador por su cuenta.
   *
   * SPRINT 3: aquí se agregarán `guardar()`, `buscarPorId()` y `buscarPorCodigo()`
   * conforme las necesiten US-006, US-007, US-009 y US-010. Ni antes, ni "por completitud".
   */
  buscarPublicadasVigentes(ahora: Date): Promise<Convocatoria[]>;
}
