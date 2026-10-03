/**
 * CAPA: domain/entities/
 * ────────────────────────────────────────────────────────────────────────────────
 * Perfil académico y socioeconómico del estudiante (US-011).
 *
 * Es la clase `Estudiante` del diagrama de clases. Su identidad es la del `Usuario` al que
 * pertenece (relación 1 a 0..1): un usuario tiene como mucho un perfil, y el id del perfil ES el
 * id del usuario. La identidad de la persona —nombre, CUI— vive en `Usuario` (nota ³ del
 * diagrama); aquí solo están los datos con los que se evalúa la elegibilidad.
 *
 * SE PUEDE GUARDAR INCOMPLETO, A PROPÓSITO
 *   Reunir el promedio o la constancia de ingresos puede tomar días. Obligar a llenarlo todo de
 *   una vez haría que la persona lo abandone. Por eso los campos son opcionales al guardar, y la
 *   regla que importa es otra: el criterio 3 de US-011, *"el perfil debe estar completo antes de
 *   poder enviar una solicitud"*. Esa regla es `perfilCompleto()`, y `camposFaltantes()` dice
 *   exactamente qué falta (US-014, criterio 2).
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Departamento, NivelAcademico } from '../enums/catalogos';

export interface DatosPerfil {
  readonly centroEducativo: string | null;
  readonly nivel: NivelAcademico | null;
  readonly promedio: number | null;
  readonly ingresoFamiliarMensual: number | null;
  readonly dependientes: number | null;
  readonly departamento: Departamento | null;
  readonly municipio: string | null;
}

/** Nombre legible de cada campo, para decirle a la persona qué le falta. */
const NOMBRE_CAMPO: Readonly<Record<keyof DatosPerfil, string>> = {
  centroEducativo: 'centro educativo',
  nivel: 'nivel académico',
  promedio: 'promedio',
  ingresoFamiliarMensual: 'ingreso familiar mensual',
  dependientes: 'número de dependientes',
  departamento: 'departamento',
  municipio: 'municipio',
};

export class Estudiante {
  readonly centroEducativo: string | null;
  readonly nivel: NivelAcademico | null;
  readonly promedio: number | null;
  readonly ingresoFamiliarMensual: number | null;
  readonly dependientes: number | null;
  readonly departamento: Departamento | null;
  readonly municipio: string | null;

  constructor(
    readonly usuarioId: string,
    datos: DatosPerfil,
  ) {
    // US-011, criterio 2.
    if (datos.promedio !== null && !(datos.promedio >= 0 && datos.promedio <= 100)) {
      throw new ReglaDeNegocioError('El promedio debe estar entre 0 y 100.');
    }
    if (
      datos.ingresoFamiliarMensual !== null &&
      !(Number.isFinite(datos.ingresoFamiliarMensual) && datos.ingresoFamiliarMensual >= 0)
    ) {
      throw new ReglaDeNegocioError('El ingreso familiar no puede ser negativo.');
    }
    if (
      datos.dependientes !== null &&
      !(Number.isInteger(datos.dependientes) && datos.dependientes >= 0)
    ) {
      throw new ReglaDeNegocioError('El número de dependientes debe ser un entero no negativo.');
    }

    this.centroEducativo = Estudiante.textoOpcional(datos.centroEducativo);
    this.nivel = datos.nivel;
    this.promedio = datos.promedio;
    this.ingresoFamiliarMensual = datos.ingresoFamiliarMensual;
    this.dependientes = datos.dependientes;
    this.departamento = datos.departamento;
    this.municipio = Estudiante.textoOpcional(datos.municipio);
  }

  /** US-011, criterio 3. */
  perfilCompleto(): boolean {
    return this.camposFaltantes().length === 0;
  }

  /** Los campos que faltan, con su nombre legible. Vacío si el perfil está completo. */
  camposFaltantes(): string[] {
    return (Object.keys(NOMBRE_CAMPO) as (keyof DatosPerfil)[])
      .filter((campo) => this[campo] === null)
      .map((campo) => NOMBRE_CAMPO[campo]);
  }

  /** Un texto en blanco cuenta como no llenado: "   " no es un centro educativo. */
  private static textoOpcional(valor: string | null): string | null {
    const limpio = valor?.trim().replace(/\s+/g, ' ') ?? '';
    return limpio === '' ? null : limpio;
  }
}
