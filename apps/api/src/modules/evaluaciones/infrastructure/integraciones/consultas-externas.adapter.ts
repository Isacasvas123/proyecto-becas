/**
 * Adaptadores entre `evaluaciones` y los módulos que exportan lo que necesita. Traducen, no
 * deciden: ninguna regla de negocio vive aquí.
 */
import { Injectable } from '@nestjs/common';

import { ConsultarConvocatoriaService } from '../../../convocatorias/application/services/consultar-convocatoria.service';
import { PerfilEstudianteService } from '../../../estudiantes/application/services/perfil-estudiante.service';
import { SolicitudesParaEvaluacionService } from '../../../solicitudes/application/services/solicitudes-para-evaluacion.service';
import { CuentasEvaluadorService } from '../../../usuarios/application/services/cuentas-evaluador.service';
import {
  ArchivoVisible,
  ConsultaConvocatoriasEvaluacion,
  ConsultaCuentas,
  ConsultaPerfilesEvaluacion,
  ConsultaSolicitudes,
  ConvocatoriaEvaluable,
  ExpedienteVisible,
  PerfilEvaluable,
  Persona,
  SolicitudResumida,
} from '../../domain/ports/consultas-externas';

@Injectable()
export class ConsultaSolicitudesAdapter implements ConsultaSolicitudes {
  constructor(private readonly solicitudes: SolicitudesParaEvaluacionService) {}

  enviadasDe(convocatoriaId: string): Promise<SolicitudResumida[]> {
    return this.solicitudes.enviadasDe(convocatoriaId);
  }

  enEvaluacionDe(convocatoriaId: string): Promise<SolicitudResumida[]> {
    return this.solicitudes.enEvaluacionDe(convocatoriaId);
  }

  resumenes(ids: readonly string[]): Promise<SolicitudResumida[]> {
    return this.solicitudes.resumenes(ids);
  }

  iniciarEvaluacion(ids: readonly string[], convocatoriaId: string, autorId: string) {
    return this.solicitudes.iniciarEvaluacion(ids, convocatoriaId, autorId);
  }

  async expediente(id: string): Promise<ExpedienteVisible | null> {
    const encontrado = await this.solicitudes.expediente(id);
    if (encontrado === null) return null;
    // Al evaluador no se le pasa la ubicación interna de los archivos ni el historial.
    return {
      resumen: encontrado.resumen,
      convocatoriaTitulo: encontrado.detalle.convocatoria.titulo,
      documentos: encontrado.detalle.documentos.map((d) => ({
        tipo: d.tipo,
        descripcion: d.descripcion,
        cargado: d.cargado,
        nombreArchivo: d.nombreArchivo,
        tamanoBytes: d.tamanoBytes,
      })),
    };
  }

  documento(id: string, tipo: string): Promise<ArchivoVisible | null> {
    return this.solicitudes.documento(id, tipo);
  }
}

@Injectable()
export class ConsultaConvocatoriasEvaluacionAdapter implements ConsultaConvocatoriasEvaluacion {
  constructor(private readonly convocatorias: ConsultarConvocatoriaService) {}

  async buscar(id: string): Promise<ConvocatoriaEvaluable | null> {
    const c = await this.convocatorias.paraPostulacion(id);
    return c === null
      ? null
      : { id: c.id, codigo: c.codigo, titulo: c.titulo, tipo: c.tipo, cupos: c.cupos };
  }
}

@Injectable()
export class ConsultaPerfilesEvaluacionAdapter implements ConsultaPerfilesEvaluacion {
  constructor(private readonly perfiles: PerfilEstudianteService) {}

  async perfil(estudianteId: string): Promise<PerfilEvaluable> {
    const p = await this.perfiles.obtener(estudianteId);
    return {
      centroEducativo: p.centroEducativo,
      nivel: p.nivel,
      promedio: p.promedio,
      ingresoFamiliarMensual: p.ingresoFamiliarMensual,
      dependientes: p.dependientes,
      departamento: p.departamento,
      municipio: p.municipio,
    };
  }
}

@Injectable()
export class ConsultaCuentasAdapter implements ConsultaCuentas {
  constructor(private readonly cuentas: CuentasEvaluadorService) {}

  evaluadores(): Promise<Persona[]> {
    return this.cuentas.listar();
  }

  personas(ids: readonly string[]): Promise<Persona[]> {
    return this.cuentas.resumenes([...new Set(ids)]);
  }
}
