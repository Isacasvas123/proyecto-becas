/**
 * Puerto: lo que el dominio necesita del exterior, en su propio vocabulario. Devuelve
 * `Convocatoria` y no filas de Prisma.
 *
 * Está en domain/ y no en infrastructure/ porque aquí se invierte la dependencia (SOLID · D). Sin
 * esta interfaz el servicio dependería del repositorio de Prisma y el ORM mandaría sobre el
 * diseño. Con ella:
 *
 *       application ──▶ [ ConvocatoriaRepositorio ]  ◀── infrastructure
 *                              (domain)
 *
 * Prisma pasa a ser un detalle reemplazable y las pruebas usan una implementación en memoria.
 *
 * Segregación de interfaces (SOLID · I): un método, el que hoy se usa. Cada historia agrega el
 * que necesita (docs/05-arquitectura.md §2.4).
 */
import { Convocatoria } from '../entities/convocatoria.entity';

/**
 * Token de inyección. La interfaz desaparece al compilar y no sirve como identificador en
 * ejecución; este `Symbol` enlaza el puerto con su adaptador. Es JavaScript puro, así que no
 * contamina el dominio con dependencias de framework.
 */
export const CONVOCATORIA_REPOSITORIO = Symbol('ConvocatoriaRepositorio');

export interface ConvocatoriaRepositorio {
  /**
   * Devuelve las convocatorias publicadas y aún vigentes en la fecha indicada (US-008).
   *
   * `ahora` viaja como parámetro para que el criterio temporal lo fije quien orquesta el
   * caso de uso, y no cada adaptador por su cuenta.
   *
   */
  buscarPublicadasVigentes(ahora: Date): Promise<Convocatoria[]>;

  /** Todas, en cualquier estado, para el panel de gestión del administrador. */
  buscarTodas(): Promise<Convocatoria[]>;

  /** `null` si no existe: decidir si eso es un error le corresponde al caso de uso. */
  buscarPorId(id: string): Promise<Convocatoria | null>;

  /**
   * Crea la convocatoria si no existe o actualiza la que ya existe con ese `id`.
   *
   * Un solo método y no `crear` + `actualizar` porque para el dominio es la misma operación:
   * "persiste este estado". Si el servicio tuviera que decidir cuál llamar, estaría
   * razonando sobre la base de datos.
   */
  guardar(convocatoria: Convocatoria): Promise<void>;

  /**
   * Cuántas convocatorias tienen un código que empieza por `prefijo` (p. ej. `UNIV-2026-`).
   * Sirve para calcular el siguiente correlativo.
   */
  contarConPrefijoDeCodigo(prefijo: string): Promise<number>;
}
