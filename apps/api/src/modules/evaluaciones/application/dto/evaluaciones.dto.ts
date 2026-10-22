/** Lo que devuelven los casos de uso de `evaluaciones`. Datos planos, nunca entidades. */
import { LineaDesglose } from '../../domain/strategies/criterio-evaluacion.strategy';

export interface PersonaDto {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly nombreUsuario: string;
}

export interface IntegranteDto extends PersonaDto {
  readonly asignadas: number;
  readonly dictaminadas: number;
}

export interface ComiteDto {
  readonly id: string;
  readonly nombre: string;
  readonly convocatoria: {
    readonly id: string;
    readonly codigo: string;
    readonly titulo: string;
    readonly tipo: string;
    readonly cupos: number;
  };
  /** El criterio con que se puntúa esta convocatoria (patrón Strategy). */
  readonly criterio: string;
  readonly integrantes: readonly IntegranteDto[];
  readonly creadoPor: string;
  readonly creadoEn: string;
}

export interface SolicitudPorAsignarDto {
  readonly id: string;
  readonly numero: string;
  readonly enviadaEn: string | null;
}

export interface ResultadoAsignacionDto {
  readonly solicitudes: number;
  readonly asignaciones: number;
}

/** US-020. */
export interface SolicitudAsignadaDto {
  readonly solicitudId: string;
  readonly numero: string;
  readonly estado: string;
  readonly convocatoria: string;
  readonly asignadaEn: string;
  readonly dictaminada: boolean;
  readonly puntaje: number | null;
  readonly recomendacion: string | null;
}

export interface DictamenDto {
  readonly criterio: string;
  readonly puntaje: number;
  readonly desglose: readonly LineaDesglose[];
  readonly recomendacion: string;
  readonly observacion: string;
  readonly emitidoEn: string;
}

/** US-019: lo que el evaluador ve para dictaminar. */
export interface ExpedienteEvaluacionDto {
  readonly solicitudId: string;
  readonly numero: string;
  readonly estado: string;
  readonly convocatoria: string;
  readonly solicitante: {
    readonly nombreCompleto: string;
    readonly centroEducativo: string | null;
    readonly nivel: string | null;
    readonly promedio: number | null;
    readonly ingresoFamiliarMensual: number | null;
    readonly dependientes: number | null;
    readonly departamento: string | null;
    readonly municipio: string | null;
  };
  readonly documentos: readonly {
    readonly tipo: string;
    readonly descripcion: string;
    readonly cargado: boolean;
    readonly nombreArchivo: string | null;
    readonly tamanoBytes: number | null;
  }[];
  /** El puntaje que se registrará si dictamina ahora. `null` si falta un dato del perfil. */
  readonly calculo: {
    readonly criterio: string;
    readonly puntaje: number;
    readonly desglose: readonly LineaDesglose[];
  } | null;
  readonly problemaCalculo: string | null;
  readonly puedeDictaminar: boolean;
  readonly dictamen: DictamenDto | null;
}

/** US-021: una fila del consolidado. */
export interface FilaConsolidadoDto {
  readonly solicitudId: string;
  readonly numero: string;
  readonly estado: string;
  readonly estudiante: string;
  readonly evaluadoresAsignados: number;
  readonly dictamenesEmitidos: number;
  readonly puntajePromedio: number | null;
  readonly favorables: number;
  readonly desfavorables: number;
  /**
   * Lo que DIJO cada evaluador, no solo cuántos votaron a favor.
   *
   * Faltaba, y era un hueco de US-023: quien resuelve veía «1 a favor · 0 en contra» y un
   * puntaje, pero nunca podía leer el razonamiento en el que iba a apoyar su decisión.
   * Un número no se puede citar en el motivo de una resolución; una observación sí.
   */
  readonly dictamenes: readonly {
    readonly evaluador: string;
    readonly recomendacion: string;
    readonly puntaje: number;
    readonly observacion: string;
    readonly emitidoEn: Date;
  }[];
  /** Lugar en el ranking. `null` mientras no tenga ningún dictamen. */
  readonly posicion: number | null;
  readonly dentroDeCupos: boolean;
}

export interface ConsolidadoDto {
  readonly comiteId: string;
  readonly convocatoria: string;
  readonly cupos: number;
  readonly completas: number;
  readonly filas: readonly FilaConsolidadoDto[];
}
