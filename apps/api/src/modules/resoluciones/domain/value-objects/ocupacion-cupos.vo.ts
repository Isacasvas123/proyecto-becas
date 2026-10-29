/**
 * Cuántos cupos de una convocatoria están tomados (US-023, criterio 4, y US-024).
 *
 * El cupo se ocupa al aprobar, no al adjudicar: si se contara al adjudicar se podrían aprobar más
 * solicitudes que becas. Aprobar reserva el cupo y adjudicar lo formaliza, por eso adjudicar no
 * vuelve a comprobarlo.
 *
 * Esta clase decide la regla para mostrarla y validarla antes de intentar. La garantía bajo
 * concurrencia la da el repositorio de solicitudes, que cuenta y guarda en una transacción.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';

export class OcupacionCupos {
  constructor(
    readonly cupos: number,
    readonly aprobadas: number,
    readonly adjudicadas: number,
  ) {}

  get ocupados(): number {
    return this.aprobadas + this.adjudicadas;
  }

  get disponibles(): number {
    return Math.max(0, this.cupos - this.ocupados);
  }

  asegurarCupoParaAprobar(): void {
    if (this.disponibles === 0) {
      throw new ReglaDeNegocioError(
        `La convocatoria ya no tiene cupos disponibles (${this.cupos} en total). No se puede aprobar otra solicitud.`,
      );
    }
  }
}
