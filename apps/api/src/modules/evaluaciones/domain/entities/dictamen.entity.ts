/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * El dictamen de un evaluador sobre una solicitud (US-019, CU-10). Es la clase `Evaluacion` del
 * diagrama.
 *
 * INMUTABLE (criterio 4)
 *   No tiene ni un método que lo modifique. Todos sus campos son de solo lectura, el repositorio
 *   solo sabe crear, y la base rechaza un segundo dictamen del mismo evaluador sobre la misma
 *   solicitud. Corregir un dictamen, si algún día se permite, será otro dictamen, no una edición.
 *
 * EL PUNTAJE NO LO ESCRIBE EL EVALUADOR
 *   Lo calcula el criterio del tipo de beca (criterio 2). El evaluador aporta su juicio en la
 *   recomendación y la justifica en la observación (criterio 3).
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Recomendacion } from '../enums/recomendacion.enum';
import { LineaDesglose, ResultadoCriterio } from '../strategies/criterio-evaluacion.strategy';
import { Puntaje } from '../value-objects/puntaje.vo';

/** Mínimo de caracteres de la observación: "ok" no justifica nada. */
export const LARGO_MINIMO_OBSERVACION = 20;

export interface AtributosDictamen {
  readonly id: string;
  readonly solicitudId: string;
  readonly evaluadorId: string;
  readonly criterio: string;
  readonly puntaje: Puntaje;
  readonly desglose: readonly LineaDesglose[];
  readonly recomendacion: Recomendacion;
  readonly observacion: string;
  readonly emitidoEn: Date;
}

export class Dictamen {
  readonly id: string;
  readonly solicitudId: string;
  readonly evaluadorId: string;
  readonly criterio: string;
  readonly puntaje: Puntaje;
  readonly desglose: readonly LineaDesglose[];
  readonly recomendacion: Recomendacion;
  readonly observacion: string;
  readonly emitidoEn: Date;

  private constructor(a: AtributosDictamen) {
    this.id = a.id;
    this.solicitudId = a.solicitudId;
    this.evaluadorId = a.evaluadorId;
    this.criterio = a.criterio;
    this.puntaje = a.puntaje;
    this.desglose = Object.freeze([...a.desglose]);
    this.recomendacion = a.recomendacion;
    this.observacion = a.observacion;
    this.emitidoEn = a.emitidoEn;
    Object.freeze(this);
  }

  static emitir(datos: {
    id: string;
    solicitudId: string;
    evaluadorId: string;
    resultado: ResultadoCriterio;
    recomendacion: Recomendacion;
    observacion: string;
    ahora: Date;
  }): Dictamen {
    const observacion = datos.observacion.trim();
    if (observacion.length < LARGO_MINIMO_OBSERVACION) {
      throw new ReglaDeNegocioError(
        `Justifique su dictamen: la observación debe tener al menos ${LARGO_MINIMO_OBSERVACION} caracteres.`,
      );
    }
    return new Dictamen({
      id: datos.id,
      solicitudId: datos.solicitudId,
      evaluadorId: datos.evaluadorId,
      criterio: datos.resultado.criterio,
      puntaje: datos.resultado.puntaje,
      desglose: datos.resultado.desglose,
      recomendacion: datos.recomendacion,
      observacion,
      emitidoEn: datos.ahora,
    });
  }

  static reconstituir(atributos: AtributosDictamen): Dictamen {
    return new Dictamen(atributos);
  }
}
