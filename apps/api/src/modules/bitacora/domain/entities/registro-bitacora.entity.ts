/**
 * Un asiento de la bitácora: quién hizo qué, sobre qué, cómo terminó y cuándo.
 *
 * Es inmutable, igual que `Dictamen` y el historial de la solicitud: una bitácora que se puede
 * corregir no sirve de evidencia.
 *
 * No guarda datos personales (CUI, correos, contraseñas, documentos), solo identificadores. Quien
 * necesite el dato lo busca en su tabla, donde el control de acceso sigue aplicando.
 */
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';

export interface Actor {
  /** Nulo cuando no había sesión: un intento de inicio fallido también se registra. */
  readonly id: string | null;
  readonly nombreUsuario: string | null;
  readonly rol: RolUsuario | null;
}

export interface AtributosRegistro {
  readonly actor: Actor;
  /** Qué se hizo, en palabras del sistema: `POST /convocatorias/:id/publicar`. */
  readonly accion: string;
  /** Sobre qué entidad y cuál, cuando la ruta lo dice. */
  readonly entidad: string | null;
  readonly entidadId: string | null;
  /** Código HTTP con el que terminó. Un 403 o un 422 también son evidencia. */
  readonly resultado: number;
  readonly origen: string | null;
  readonly ocurridoEn: Date;
}

export class RegistroBitacora {
  readonly actor: Actor;
  readonly accion: string;
  readonly entidad: string | null;
  readonly entidadId: string | null;
  readonly resultado: number;
  readonly origen: string | null;
  readonly ocurridoEn: Date;

  constructor(atributos: AtributosRegistro) {
    this.actor = { ...atributos.actor };
    this.accion = atributos.accion;
    this.entidad = atributos.entidad;
    this.entidadId = atributos.entidadId;
    this.resultado = atributos.resultado;
    this.origen = atributos.origen;
    this.ocurridoEn = atributos.ocurridoEn;
    Object.freeze(this.actor);
    Object.freeze(this);
  }

  /** Si la petición fue rechazada. Se mira mucho al revisar una bitácora. */
  get fueRechazada(): boolean {
    return this.resultado >= 400;
  }
}
