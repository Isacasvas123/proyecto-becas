/**
 * CAPA: domain/estados/  ·  PATRÓN STATE (comportamiento)
 * ────────────────────────────────────────────────────────────────────────────────
 * Justificación completa en docs/06-patrones.md §5. El ciclo de vida, tal como lo dibuja el
 * diagrama de estados de docs/diagramas/03-clases-dominio.md §2:
 *
 *     BORRADOR ──enviar──▶ ENVIADA ──iniciarEvaluacion──▶ EN_EVALUACION ──resolver──▶ APROBADA ──adjudicar──▶ ADJUDICADA
 *                                                            │  (si el monto > Q10,000)
 *                                                            └──▶ APROBACION_PENDIENTE ──confirmar──▶ APROBADA
 *                                                                          └────────▶ RECHAZADA
 *
 * CÓMO ESTÁ HECHO
 *   `EstadoSolicitud` RECHAZA TODO por defecto. Cada estado concreto sobrescribe solo lo que sí
 *   permite. Consecuencia: una transición que no aparece en el diagrama no existe en el código, y
 *   nadie tiene que acordarse de comprobarlo. Evaluar un borrador o adjudicar una rechazada lanza
 *   `TransicionInvalidaError` desde el propio estado.
 *
 * UNA DECISIÓN DE DISEÑO: LOS ESTADOS DECIDEN, NO MODIFICAN
 *   Cada transición DEVUELVE el estado siguiente; es la `Solicitud` quien lo aplica y lo registra
 *   en su historial. En la variante clásica el estado llama a `solicitud.cambiarEstado(...)`, lo
 *   que obliga a exponer ese método a cualquiera. Así la solicitud es la única que se modifica a sí
 *   misma, y cada estado se prueba sin construir una solicitud completa.
 *
 * ALCANCE
 *   Las seis clases y las cinco transiciones del diagrama existen desde ya, porque son el modelo y
 *   se prueban solas. Los CASOS DE USO que disparan evaluar, resolver y adjudicar llegan con sus
 *   historias: EPIC-04 (Sprint 5) y EPIC-05 (Sprint 6).
 */
import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { Decision, NombreEstado } from '../enums/solicitud.enums';

/** Lo que un estado necesita saber de la solicitud para decidir. Nada más. */
export interface VistaSolicitud {
  documentosFaltantes(): readonly string[];
  /**
   * Si la beca supera el monto que obliga a una segunda aprobación (PO, 17 Oct 2026). Es una
   * pregunta, no el monto: al estado no le importa cuánto vale la beca, solo si la regla aplica.
   */
  necesitaSegundaAprobacion(): boolean;
}

export abstract class EstadoSolicitud {
  abstract readonly nombre: NombreEstado;

  /** Solo el borrador admite documentos (US-013, criterio 3). */
  verificarCargaDeDocumentos(): void {
    this.rechazar('cargar o reemplazar documentos de');
  }

  enviar(_solicitud: VistaSolicitud): EstadoSolicitud {
    return this.rechazar('enviar');
  }

  iniciarEvaluacion(): EstadoSolicitud {
    return this.rechazar('pasar a evaluación');
  }

  resolver(_decision: Decision, _solicitud: VistaSolicitud): EstadoSolicitud {
    return this.rechazar('resolver');
  }

  /** Segunda aprobacion (PO, 17 Oct 2026). Solo la admite el estado que la espera. */
  confirmarAprobacion(): EstadoSolicitud {
    return this.rechazar('confirmar la aprobacion de');
  }

  adjudicar(): EstadoSolicitud {
    return this.rechazar('adjudicar');
  }

  /** Una solicitud rechazada deja libre al estudiante para volver a postular (US-012). */
  estaActiva(): boolean {
    return true;
  }

  protected rechazar(accion: string): never {
    throw new TransicionInvalidaError(
      `No se puede ${accion} una solicitud en estado ${this.nombre}.`,
    );
  }
}

export class EstadoBorrador extends EstadoSolicitud {
  readonly nombre = NombreEstado.BORRADOR;

  verificarCargaDeDocumentos(): void {
    // Permitido: es el único estado donde el expediente se puede modificar.
  }

  /** US-014, criterio 1: solo con todos los documentos exigidos. */
  enviar(solicitud: VistaSolicitud): EstadoSolicitud {
    const faltantes = solicitud.documentosFaltantes();
    if (faltantes.length > 0) {
      throw new ReglaDeNegocioError(`Faltan documentos exigidos: ${faltantes.join(', ')}.`);
    }
    return new EstadoEnviada();
  }
}

export class EstadoEnviada extends EstadoSolicitud {
  readonly nombre = NombreEstado.ENVIADA;

  /** Cuando se asigna a un comité (US-018, Sprint 5). */
  iniciarEvaluacion(): EstadoSolicitud {
    return new EstadoEnEvaluacion();
  }
}

export class EstadoEnEvaluacion extends EstadoSolicitud {
  readonly nombre = NombreEstado.EN_EVALUACION;

  /**
   * US-023. Rechazar siempre termina aqui. Aprobar depende del monto: por encima del umbral
   * (PO, 17 Oct 2026) la aprobacion queda a medias y espera una segunda firma.
   */
  resolver(decision: Decision, solicitud: VistaSolicitud): EstadoSolicitud {
    if (decision === Decision.RECHAZAR) return new EstadoRechazada();
    return solicitud.necesitaSegundaAprobacion()
      ? new EstadoAprobacionPendiente()
      : new EstadoAprobada();
  }
}

/**
 * Primera aprobacion dada, falta la segunda (PO, 17 Oct 2026).
 *
 * No ocupa cupo: el cupo se reserva cuando la aprobacion se completa. Asi, dos solicitudes
 * grandes pueden esperar la segunda firma sin bloquear cupos que todavia no son de nadie.
 *
 * Desde aqui solo se puede confirmar o rechazar. Adjudicar no: todavia no esta aprobada.
 */
export class EstadoAprobacionPendiente extends EstadoSolicitud {
  readonly nombre = NombreEstado.APROBACION_PENDIENTE;

  confirmarAprobacion(): EstadoSolicitud {
    return new EstadoAprobada();
  }

  /** Quien da la segunda firma tambien puede rechazarla; aprobar de nuevo no es una via. */
  resolver(decision: Decision, _solicitud: VistaSolicitud): EstadoSolicitud {
    if (decision === Decision.RECHAZAR) return new EstadoRechazada();
    throw new TransicionInvalidaError(
      'Esta solicitud ya tiene la primera aprobacion: confirme la segunda en lugar de aprobarla otra vez.',
    );
  }
}

export class EstadoAprobada extends EstadoSolicitud {
  readonly nombre = NombreEstado.APROBADA;

  /** US-024, Sprint 6. El cupo lo verifica la convocatoria, no el estado. */
  adjudicar(): EstadoSolicitud {
    return new EstadoAdjudicada();
  }
}

/** Terminal. No sobrescribe nada: todo lo rechaza la clase base. */
export class EstadoRechazada extends EstadoSolicitud {
  readonly nombre = NombreEstado.RECHAZADA;

  estaActiva(): boolean {
    return false;
  }
}

/** Terminal. */
export class EstadoAdjudicada extends EstadoSolicitud {
  readonly nombre = NombreEstado.ADJUDICADA;
}

/**
 * Reconstruye el objeto de estado a partir del nombre guardado en la base.
 *
 * Es un mapa y no un `switch`, y `satisfies` convierte en error de compilación agregar un estado
 * al enum sin su clase.
 */
const CONSTRUCTORES = {
  [NombreEstado.BORRADOR]: () => new EstadoBorrador(),
  [NombreEstado.ENVIADA]: () => new EstadoEnviada(),
  [NombreEstado.EN_EVALUACION]: () => new EstadoEnEvaluacion(),
  [NombreEstado.APROBACION_PENDIENTE]: () => new EstadoAprobacionPendiente(),
  [NombreEstado.APROBADA]: () => new EstadoAprobada(),
  [NombreEstado.RECHAZADA]: () => new EstadoRechazada(),
  [NombreEstado.ADJUDICADA]: () => new EstadoAdjudicada(),
} as const satisfies Record<NombreEstado, () => EstadoSolicitud>;

export function estadoDesde(nombre: NombreEstado): EstadoSolicitud {
  return CONSTRUCTORES[nombre]();
}
