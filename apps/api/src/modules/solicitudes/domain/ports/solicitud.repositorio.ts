import { Solicitud } from '../entities/solicitud.entity';
import { NombreEstado } from '../enums/solicitud.enums';

export const SOLICITUD_REPOSITORIO = Symbol('SolicitudRepositorio');

export interface FiltroSolicitudesReporte {
  readonly convocatoriaId?: string;
  readonly estados?: readonly NombreEstado[];
  readonly enviadasDesde?: Date;
  readonly enviadasHasta?: Date;
}

export interface SolicitudRepositorio {
  buscarPorId(id: string): Promise<Solicitud | null>;

  /** US-015: las del estudiante, las más recientes primero. */
  buscarPorEstudiante(estudianteId: string): Promise<Solicitud[]>;

  /** US-012, criterio 2: la solicitud activa (no rechazada) de ese estudiante en esa convocatoria. */
  buscarActiva(estudianteId: string, convocatoriaId: string): Promise<Solicitud | null>;

  contarConPrefijoDeNumero(prefijo: string): Promise<number>;

  /** US-018: las de una convocatoria en un estado, por orden de envío. */
  buscarPorConvocatoriaYEstado(convocatoriaId: string, estado: NombreEstado): Promise<Solicitud[]>;

  /** Varias por id. Las que no existan no aparecen. */
  buscarPorIds(ids: readonly string[]): Promise<Solicitud[]>;

  /** Guarda la solicitud con sus documentos y su historial, todo o nada. */
  guardar(solicitud: Solicitud): Promise<void>;
  /**
   * ¿Esta persona ya tiene una beca adjudicada en otra solicitud?
   *
   * `exceptoSolicitudId` deja fuera la que se está resolviendo, porque si no una solicitud
   * ya adjudicada se bloquearía a sí misma.
   */
  tieneBecaAdjudicada(estudianteId: string, exceptoSolicitudId: string): Promise<boolean>;
  /**
   * Cuántas solicitudes ocupan cupo en cada convocatoria de la lista.
   *
   * En lote y no una por una: el listado público pregunta por todas las convocatorias
   * vigentes a la vez, y hacerlo de una en una serían diez viajes a la base por cada
   * visitante de la página de inicio.
   */
  contarOcupacionDe(
    convocatoriaIds: readonly string[],
  ): Promise<Map<string, { aprobadas: number; adjudicadas: number }>>;

  /**
   * US-023, criterio 4: guarda una solicitud recién APROBADA solo si su convocatoria todavía tiene
   * cupo. La comprobación y la escritura DEBEN ser atómicas: dos aprobaciones simultáneas no pueden
   * pasar las dos por el último cupo. Si no hay cupo, lanza `ReglaDeNegocioError` y no guarda nada.
   */
  guardarSiHayCupo(solicitud: Solicitud, cupos: number): Promise<void>;

  /** Cuántas solicitudes de la convocatoria ocupan cupo: APROBADAS y ADJUDICADAS. */
  contarOcupacion(convocatoriaId: string): Promise<{ aprobadas: number; adjudicadas: number }>;

  /** US-025. */
  buscarPorNumero(numero: string): Promise<Solicitud | null>;

  contarBecasConPrefijo(prefijo: string): Promise<number>;

  /**
   * EPIC-06. Las solicitudes RECIBIDAS (nunca las que siguen en borrador) que cumplan el filtro.
   * El rango de fechas se aplica a la fecha de envío.
   */
  paraReporte(filtro: FiltroSolicitudesReporte): Promise<Solicitud[]>;
}

/** El mensaje de US-023, criterio 4. Lo usan los dos adaptadores para que no difieran. */
export const mensajeSinCupo = (cupos: number) =>
  `La convocatoria ya no tiene cupos disponibles (${cupos} en total). No se puede aprobar otra solicitud.`;
