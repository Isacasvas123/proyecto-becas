/**
 * CAPA: domain/value-objects/
 *
 * QUÉ VA AQUÍ: conceptos del negocio que se identifican por su VALOR y no por un id.
 * Son inmutables y se validan a sí mismos en el constructor: si el objeto existe,
 * es válido. No hay forma de construir un periodo incoherente.
 *
 * POR QUÉ EXISTE ESTE OBJETO DE VALOR EN VEZ DE DOS CAMPOS `Date` SUELTOS:
 * la regla "la fecha de cierre debe ser posterior a la de apertura" (US-006) es una
 * regla de negocio. Si vive como un `if` en el controlador, hay que repetirla en cada
 * punto de entrada (REST, carga masiva, tarea programada) y basta olvidarla una vez para
 * corromper los datos. Encapsulada aquí, es imposible saltársela.
 *
 * PLANTILLA: este es el ejemplo a copiar para `Cui`, `CorreoElectronico`, `Password`,
 * `Puntaje`, etc. (docs/05-arquitectura.md §2.3).
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export class PeriodoPostulacion {
  private constructor(
    public readonly apertura: Date,
    public readonly cierre: Date,
  ) {
    // `Object.freeze` deja la inmutabilidad explícita en tiempo de ejecución, no solo
    // como promesa del compilador.
    Object.freeze(this);
  }

  /**
   * Única vía de construcción. Valida las invariantes ANTES de que el objeto exista.
   */
  static crear(apertura: Date, cierre: Date): PeriodoPostulacion {
    if (Number.isNaN(apertura.getTime()) || Number.isNaN(cierre.getTime())) {
      throw new ReglaDeNegocioError('Las fechas del periodo de postulación no son válidas.');
    }
    if (cierre.getTime() <= apertura.getTime()) {
      throw new ReglaDeNegocioError(
        'La fecha de cierre debe ser posterior a la fecha de apertura.',
      );
    }
    return new PeriodoPostulacion(new Date(apertura), new Date(cierre));
  }

  /** ¿La fecha indicada cae dentro del periodo (apertura incluida, cierre incluido)? */
  contiene(fecha: Date): boolean {
    return fecha.getTime() >= this.apertura.getTime() && fecha.getTime() <= this.cierre.getTime();
  }

  /** ¿Ya pasó la fecha de cierre? Regla del listado público (US-008). */
  haVencido(fecha: Date): boolean {
    return fecha.getTime() > this.cierre.getTime();
  }

  /**
   * Igualdad por valor, no por referencia: es lo que distingue a un objeto de valor
   * de una entidad.
   */
  equals(otro: PeriodoPostulacion): boolean {
    return (
      this.apertura.getTime() === otro.apertura.getTime() &&
      this.cierre.getTime() === otro.cierre.getTime()
    );
  }
}
