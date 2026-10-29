/**
 * Patrón Builder. Justificación en docs/06-patrones.md §2.
 *
 * Un reporte combina ocho elementos opcionales: convocatoria, estados, nivel, departamento,
 * fechas, agrupación, orden y formato. Con un constructor serían nueve argumentos, la mayoría
 * `null`. Con el builder cada llamada dice lo que es:
 *
 *     new ReporteBuilder()
 *       .conEstados(['APROBADA', 'ADJUDICADA'])
 *       .deNivel('POSGRADO')
 *       .agrupadoPor('DEPARTAMENTO')
 *       .build();
 *
 * `build()` rechaza las combinaciones sin sentido antes de consultar nada: fechas al revés,
 * estados vacíos, agrupar por el dato por el que se filtró. Devuelve un objeto congelado.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import {
  AGRUPACIONES,
  Agrupacion,
  ESTADOS_REPORTABLES,
  EspecificacionReporte,
  EstadoReportable,
  FORMATOS,
  Formato,
  NIVELES,
  Nivel,
  ORDENES,
  Orden,
} from '../../domain/especificacion-reporte';

const FORMATO_DEPARTAMENTO = /^[A-Z_]{3,20}$/;

export class ReporteBuilder {
  private convocatoriaId: string | null = null;
  private estados: EstadoReportable[] | null = null;
  private nivel: Nivel | null = null;
  private departamento: string | null = null;
  private desde: Date | null = null;
  private hasta: Date | null = null;
  private agrupacion: Agrupacion | null = null;
  private orden: Orden = 'NUMERO';
  private formato: Formato = 'JSON';

  deConvocatoria(id: string): this {
    this.convocatoriaId = id;
    return this;
  }

  conEstados(estados: readonly string[]): this {
    const invalidos = estados.filter((e) => !incluye(ESTADOS_REPORTABLES, e));
    if (invalidos.length > 0) {
      throw new ReglaDeNegocioError(
        `Estado no reportable: ${invalidos.join(', ')}. Los borradores no son solicitudes recibidas.`,
      );
    }
    this.estados = [...new Set(estados as EstadoReportable[])];
    return this;
  }

  deNivel(nivel: string): this {
    if (!incluye(NIVELES, nivel)) {
      throw new ReglaDeNegocioError(`Nivel académico desconocido: ${nivel}.`);
    }
    this.nivel = nivel;
    return this;
  }

  deDepartamento(departamento: string): this {
    if (!FORMATO_DEPARTAMENTO.test(departamento)) {
      throw new ReglaDeNegocioError(`Departamento no válido: ${departamento}.`);
    }
    this.departamento = departamento;
    return this;
  }

  /** Por fecha de envío. Cualquiera de los dos extremos puede faltar. */
  entreFechas(desde: Date | null, hasta: Date | null): this {
    this.desde = desde;
    this.hasta = hasta;
    return this;
  }

  agrupadoPor(agrupacion: string): this {
    if (!incluye(AGRUPACIONES, agrupacion)) {
      throw new ReglaDeNegocioError(`No se puede agrupar por ${agrupacion}.`);
    }
    this.agrupacion = agrupacion;
    return this;
  }

  ordenadoPor(orden: string): this {
    if (!incluye(ORDENES, orden)) {
      throw new ReglaDeNegocioError(`Orden desconocido: ${orden}.`);
    }
    this.orden = orden;
    return this;
  }

  enFormato(formato: string): this {
    if (!incluye(FORMATOS, formato)) {
      throw new ReglaDeNegocioError(`Formato no disponible: ${formato}. Use JSON, CSV o PDF.`);
    }
    this.formato = formato;
    return this;
  }

  build(): EspecificacionReporte {
    if (this.desde !== null && this.hasta !== null && this.desde > this.hasta) {
      throw new ReglaDeNegocioError('La fecha inicial no puede ser posterior a la final.');
    }
    if (this.estados !== null && this.estados.length === 0) {
      throw new ReglaDeNegocioError('Elija al menos un estado, o no filtre por estado.');
    }

    // Agrupar por el mismo dato por el que se filtró deja un único grupo: no informa nada.
    const redundante =
      (this.agrupacion === 'CONVOCATORIA' && this.convocatoriaId !== null) ||
      (this.agrupacion === 'NIVEL' && this.nivel !== null) ||
      (this.agrupacion === 'DEPARTAMENTO' && this.departamento !== null) ||
      (this.agrupacion === 'ESTADO' && this.estados?.length === 1);
    if (redundante) {
      throw new ReglaDeNegocioError(
        'Agrupar por el mismo dato por el que filtró deja un solo grupo. Quite el filtro o elija otra agrupación.',
      );
    }

    return Object.freeze({
      convocatoriaId: this.convocatoriaId,
      estados: this.estados === null ? null : Object.freeze([...this.estados]),
      nivel: this.nivel,
      departamento: this.departamento,
      desde: this.desde,
      hasta: this.hasta,
      agrupacion: this.agrupacion,
      orden: this.orden,
      formato: this.formato,
    });
  }
}

function incluye<T extends string>(lista: readonly T[], valor: string): valor is T {
  return (lista as readonly string[]).includes(valor);
}
