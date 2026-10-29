/**
 * Patrón Factory Method. Justificación en docs/06-patrones.md §1.
 *
 * Cada tipo de beca se crea con reglas propias: otros requisitos, otros documentos, otro prefijo
 * de código y, en posgrado, un tope de cupos. Sin el patrón acabaría en un `switch (tipo)` en el
 * servicio, que habría que abrir y volver a probar con cada programa nuevo.
 *
 * `crear()` es el algoritmo común y no se sobrescribe; los pasos que varían son métodos
 * abstractos que define cada fábrica concreta. El servicio pide la fábrica y le dice "crea".
 *
 * Un programa nuevo no toca ninguna fábrica ni el servicio, pero sí exige la subclase, una línea
 * en `FABRICAS_CONVOCATORIA` y el valor en `TipoBeca`. El `satisfies Record<TipoBeca, …>` vuelve
 * un error de compilación olvidar esa línea.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Convocatoria } from '../entities/convocatoria.entity';
import { Requisito } from '../enums/requisito.enum';
import { TipoBeca } from '../enums/tipo-beca.enum';
import { TipoDocumento } from '../enums/tipo-documento.enum';
import { PeriodoPostulacion } from '../value-objects/periodo-postulacion.vo';

/** Lo que el administrador indica al crear una convocatoria (US-006). */
export interface DatosNuevaConvocatoria {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly cupos: number;
  /** Monto de la beca en quetzales (PO, 17 Oct 2026). */
  readonly montoBeca: number;
  readonly apertura: Date;
  readonly cierre: Date;
  /** Si no se indican, se usan los del tipo de beca (US-006, criterio 1). */
  readonly requisitos?: readonly Requisito[];
  /** Si no se indican, se usan los del tipo de beca (US-006, criterio 1). */
  readonly documentosExigidos?: readonly TipoDocumento[];
}

export abstract class ConvocatoriaFactory {
  /**
   * El método plantilla. Igual para todos los tipos; no se sobrescribe.
   *
   * Orden deliberado: primero las reglas propias del tipo (`validarCupos`) y después la
   * construcción, que valida las invariantes comunes a toda convocatoria. Así el mensaje de
   * error es el más específico posible.
   */
  crear(datos: DatosNuevaConvocatoria): Convocatoria {
    this.validarCupos(datos.cupos);
    // PO, 17 Oct 2026: una convocatoria nueva siempre declara cuanto vale su beca. El 0 solo
    // existe en las anteriores al cambio, que la entidad admite al reconstituirlas.
    if (!Number.isInteger(datos.montoBeca) || datos.montoBeca <= 0) {
      throw new ReglaDeNegocioError('El monto de la beca debe ser un entero mayor que cero.');
    }

    return Convocatoria.nuevaEnBorrador({
      id: datos.id,
      codigo: datos.codigo,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tipo: this.tipo(),
      cupos: datos.cupos,
      montoBeca: datos.montoBeca,
      periodo: PeriodoPostulacion.crear(datos.apertura, datos.cierre),
      requisitos: datos.requisitos ?? this.requisitosPorDefecto(),
      documentosExigidos: datos.documentosExigidos ?? this.documentosPorDefecto(),
    });
  }

  /** El tipo de beca que produce esta fábrica. */
  abstract tipo(): TipoBeca;

  /** Prefijo del código correlativo: `UNIV-2026-001`. */
  abstract prefijoCodigo(): string;

  /** Lo que se exige por defecto a quien postule a este tipo de beca. */
  abstract requisitosPorDefecto(): readonly Requisito[];

  /** Los documentos de respaldo que se piden por defecto. */
  abstract documentosPorDefecto(): readonly TipoDocumento[];

  /**
   * Gancho opcional. Por defecto no agrega ninguna restricción más allá de "entero mayor que
   * cero", que ya exige la entidad. Solo la sobrescribe el tipo que tenga una regla propia.
   */
  protected validarCupos(_cupos: number): void {
    // Sin restricción adicional.
  }
}

export class ConvocatoriaNivelMedioFactory extends ConvocatoriaFactory {
  tipo(): TipoBeca {
    return TipoBeca.NIVEL_MEDIO;
  }

  prefijoCodigo(): string {
    return 'NM';
  }

  requisitosPorDefecto(): readonly Requisito[] {
    return [
      Requisito.NACIONALIDAD_GUATEMALTECA,
      Requisito.ESTUDIANTE_NIVEL_MEDIO_INSCRITO,
      Requisito.PROMEDIO_MINIMO_70,
      Requisito.INGRESO_FAMILIAR_LIMITADO,
    ];
  }

  documentosPorDefecto(): readonly TipoDocumento[] {
    // Certificado de nacimiento y NO DPI: la mayoría de aspirantes de nivel medio son menores
    // de edad y todavía no tienen DPI. Ver `tipo-documento.enum.ts`.
    return [
      TipoDocumento.CERTIFICADO_NACIMIENTO,
      TipoDocumento.CONSTANCIA_INSCRIPCION,
      TipoDocumento.CERTIFICADO_NOTAS,
      TipoDocumento.CONSTANCIA_INGRESOS,
    ];
  }
}

export class ConvocatoriaUniversitariaFactory extends ConvocatoriaFactory {
  tipo(): TipoBeca {
    return TipoBeca.UNIVERSITARIA;
  }

  prefijoCodigo(): string {
    return 'UNIV';
  }

  requisitosPorDefecto(): readonly Requisito[] {
    return [
      Requisito.NACIONALIDAD_GUATEMALTECA,
      Requisito.ESTUDIANTE_UNIVERSITARIO_INSCRITO,
      Requisito.PROMEDIO_MINIMO_75,
    ];
  }

  documentosPorDefecto(): readonly TipoDocumento[] {
    return [
      TipoDocumento.DPI,
      TipoDocumento.CONSTANCIA_INSCRIPCION,
      TipoDocumento.CERTIFICADO_NOTAS,
      TipoDocumento.CONSTANCIA_INGRESOS,
    ];
  }
}

/** Tope de cupos para posgrado, tal como lo fija docs/06-patrones.md §1. */
export const MAX_CUPOS_POSGRADO = 50;

export class ConvocatoriaPosgradoFactory extends ConvocatoriaFactory {
  tipo(): TipoBeca {
    return TipoBeca.POSGRADO;
  }

  prefijoCodigo(): string {
    return 'POS';
  }

  requisitosPorDefecto(): readonly Requisito[] {
    return [
      Requisito.TITULO_UNIVERSITARIO,
      Requisito.PROMEDIO_MINIMO_80,
      Requisito.CARTA_RECOMENDACION,
    ];
  }

  documentosPorDefecto(): readonly TipoDocumento[] {
    return [
      TipoDocumento.DPI,
      TipoDocumento.TITULO_UNIVERSITARIO,
      TipoDocumento.CERTIFICADO_NOTAS,
      TipoDocumento.CARTA_RECOMENDACION,
    ];
  }

  /**
   * Única regla de cupos propia de un tipo: en posgrado, tope de 50, porque financia estudios más
   * largos y caros y cientos de cupos serían un error de captura.
   *
   * Pendiente de confirmar con el Product Owner: el 50 viene del diseño del equipo, no de un
   * criterio de aceptación. Nivel medio y universitaria no tienen tope porque nadie lo definió.
   */
  protected validarCupos(cupos: number): void {
    if (cupos > MAX_CUPOS_POSGRADO) {
      throw new ReglaDeNegocioError(
        `Una convocatoria de posgrado admite como máximo ${MAX_CUPOS_POSGRADO} cupos.`,
      );
    }
  }
}

/**
 * Registro de fábricas: el único punto donde se asocia un tipo de beca con su fábrica.
 *
 * Es un mapa y no un `switch` por la misma razón que existe el patrón. Y `satisfies`
 * convierte en error de compilación agregar un `TipoBeca` sin su fábrica.
 */
export const FABRICAS_CONVOCATORIA = {
  [TipoBeca.NIVEL_MEDIO]: new ConvocatoriaNivelMedioFactory(),
  [TipoBeca.UNIVERSITARIA]: new ConvocatoriaUniversitariaFactory(),
  [TipoBeca.POSGRADO]: new ConvocatoriaPosgradoFactory(),
} as const satisfies Readonly<Record<TipoBeca, ConvocatoriaFactory>>;

export function fabricaPara(tipo: TipoBeca): ConvocatoriaFactory {
  return FABRICAS_CONVOCATORIA[tipo];
}
