/**
 * El dictamen de un evaluador sobre una solicitud (US-019, CU-10). Es la clase `Evaluacion` del
 * diagrama.
 *
 * Es inmutable (criterio 4): sin métodos que lo modifiquen, con un repositorio que solo crea y
 * una base que rechaza un segundo dictamen del mismo evaluador sobre la misma solicitud. Corregir
 * un dictamen sería emitir otro.
 *
 * El puntaje no lo escribe el evaluador: lo calcula el criterio del tipo de beca (criterio 2). Él
 * aporta la recomendación y la observación que la justifica (criterio 3).
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
