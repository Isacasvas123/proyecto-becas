/**
 * US-028: reporte de solicitudes. Recibe la especificación de `ReporteBuilder` y produce un
 * `Reporte` independiente del formato.
 *
 * Solo entran solicitudes recibidas (los borradores aún no son trámites) y el rango de fechas se
 * aplica al envío. No salen nombres, CUI, datos socioeconómicos ni puntajes: el reporte se comparte
 * fuera del sistema (US-030) y basta el número de solicitud.
 *
 * Los tres módulos se consultan por separado y se combinan aquí. Sobra para miles de solicitudes;
 * con cientos de miles se cambiaría la fuente por una vista en la base.
 */
import { Inject, Injectable } from '@nestjs/common';

import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { EspecificacionReporte } from '../../domain/especificacion-reporte';
import {
  ConvocatoriaReportable,
  FUENTE_CONVOCATORIAS,
  FUENTE_PERFILES,
  FUENTE_SOLICITUDES,
  FuenteConvocatorias,
  FuentePerfiles,
  FuenteSolicitudes,
  PerfilReportable,
  SolicitudReportable,
} from '../../domain/ports/puertos';
import { Grupo, Reporte, Valor } from '../../domain/reporte';
import {
  NOMBRE_AGRUPACION,
  NOMBRE_ESTADO,
  NOMBRE_NIVEL,
  SIN_DATO,
  dias,
  fechaCorta,
} from '../nombres';

const COLUMNAS = [
  { clave: 'numero', titulo: 'Solicitud' },
  { clave: 'convocatoria', titulo: 'Convocatoria' },
  { clave: 'estado', titulo: 'Estado' },
  { clave: 'nivel', titulo: 'Nivel' },
  { clave: 'departamento', titulo: 'Departamento' },
  { clave: 'centroEducativo', titulo: 'Centro educativo' },
  { clave: 'enviada', titulo: 'Enviada' },
  { clave: 'resuelta', titulo: 'Resuelta' },
  { clave: 'diasResolucion', titulo: 'Días hasta resolver', numerica: true },
  { clave: 'beca', titulo: 'Beca' },
] as const;

/** Una fila ya combinada, con los datos crudos que hacen falta para agrupar y ordenar. */
interface FilaCompleta {
  readonly solicitud: SolicitudReportable;
  readonly perfil: PerfilReportable | null;
  readonly convocatoria: ConvocatoriaReportable | null;
}

@Injectable()
export class GenerarReporteService {
  constructor(
    @Inject(FUENTE_SOLICITUDES)
    private readonly solicitudes: FuenteSolicitudes,
    @Inject(FUENTE_PERFILES)
    private readonly perfiles: FuentePerfiles,
    @Inject(FUENTE_CONVOCATORIAS)
    private readonly convocatorias: FuenteConvocatorias,
  ) {}

  async generar(spec: EspecificacionReporte, ahora: Date = new Date()): Promise<Reporte> {
    const departamentos = new Map(this.perfiles.departamentos().map((d) => [d.codigo, d.nombre]));
    if (spec.departamento !== null && !departamentos.has(spec.departamento)) {
      throw new ReglaDeNegocioError(`Departamento desconocido: ${spec.departamento}.`);
    }

    const convocatorias = new Map((await this.convocatorias.todas()).map((c) => [c.id, c]));
    if (spec.convocatoriaId !== null && !convocatorias.has(spec.convocatoriaId)) {
      throw new ReglaDeNegocioError('La convocatoria indicada no existe.');
    }

    const recibidas = await this.solicitudes.recibidas({
      convocatoriaId: spec.convocatoriaId ?? undefined,
      estados: spec.estados ?? undefined,
      desde: spec.desde ?? undefined,
      hasta: spec.hasta ?? undefined,
    });
    const perfiles = new Map(
      (await this.perfiles.perfiles([...new Set(recibidas.map((s) => s.estudianteId))])).map(
        (p) => [p.usuarioId, p],
      ),
    );

    const completas: FilaCompleta[] = recibidas
      .map((solicitud) => ({
        solicitud,
        perfil: perfiles.get(solicitud.estudianteId) ?? null,
        convocatoria: convocatorias.get(solicitud.convocatoriaId) ?? null,
      }))
      .filter((f) => spec.nivel === null || f.perfil?.nivel === spec.nivel)
      .filter((f) => spec.departamento === null || f.perfil?.departamento === spec.departamento)
      .sort(comparador(spec));

    const nombreDepartamento = (codigo: string | null | undefined) =>
      codigo ? (departamentos.get(codigo) ?? codigo) : null;

    const filas = completas.map(({ solicitud: s, perfil, convocatoria }) => {
      const fila: Record<string, Valor> = {
        numero: s.numero,
        convocatoria: convocatoria?.codigo ?? null,
        estado: NOMBRE_ESTADO[s.estado] ?? s.estado,
        nivel: perfil?.nivel ? (NOMBRE_NIVEL[perfil.nivel] ?? perfil.nivel) : null,
        departamento: nombreDepartamento(perfil?.departamento),
        centroEducativo: perfil?.centroEducativo ?? null,
        enviada: fechaCorta(s.enviadaEn),
        resuelta: fechaCorta(s.resueltaEn),
        diasResolucion: s.resueltaEn === null ? null : dias(s.enviadaEn, s.resueltaEn),
        beca: s.codigoBeca,
      };
      return Object.freeze(fila);
    });

    return {
      titulo: 'Reporte de solicitudes',
      nombre: 'reporte-solicitudes',
      generadoEn: ahora.toISOString(),
      filtros: this.describirFiltros(spec, convocatorias, nombreDepartamento),
      columnas: COLUMNAS,
      filas,
      agrupacion: spec.agrupacion === null ? null : NOMBRE_AGRUPACION[spec.agrupacion],
      grupos: spec.agrupacion === null ? null : agrupar(completas, filas, spec.agrupacion),
      total: filas.length,
    };
  }

  private describirFiltros(
    spec: EspecificacionReporte,
    convocatorias: Map<string, ConvocatoriaReportable>,
    nombreDepartamento: (c: string | null) => string | null,
  ) {
    const filtros: { etiqueta: string; valor: string }[] = [];
    if (spec.convocatoriaId !== null) {
      const c = convocatorias.get(spec.convocatoriaId);
      filtros.push({ etiqueta: 'Convocatoria', valor: c ? `${c.codigo} · ${c.titulo}` : '' });
    }
    if (spec.estados !== null) {
      filtros.push({
        etiqueta: 'Estado',
        valor: spec.estados.map((e) => NOMBRE_ESTADO[e] ?? e).join(', '),
      });
    }
    if (spec.nivel !== null) {
      filtros.push({ etiqueta: 'Nivel', valor: NOMBRE_NIVEL[spec.nivel] ?? spec.nivel });
    }
    if (spec.departamento !== null) {
      filtros.push({
        etiqueta: 'Departamento',
        valor: nombreDepartamento(spec.departamento) ?? '',
      });
    }
    if (spec.desde !== null || spec.hasta !== null) {
      filtros.push({
        etiqueta: 'Enviadas',
        valor: `del ${fechaCorta(spec.desde) ?? 'inicio'} al ${fechaCorta(spec.hasta) ?? 'día de hoy'}`,
      });
    }
    if (filtros.length === 0) {
      filtros.push({ etiqueta: 'Alcance', valor: 'Todas las solicitudes recibidas' });
    }
    return filtros;
  }
}

function comparador(spec: EspecificacionReporte) {
  return (a: FilaCompleta, b: FilaCompleta): number => {
    const ta = a.solicitud.enviadaEn.getTime();
    const tb = b.solicitud.enviadaEn.getTime();
    if (spec.orden === 'ENVIO_RECIENTE') return tb - ta;
    if (spec.orden === 'ENVIO_ANTIGUO') return ta - tb;
    return a.solicitud.numero.localeCompare(b.solicitud.numero);
  };
}

function agrupar(
  completas: readonly FilaCompleta[],
  filas: readonly Readonly<Record<string, Valor>>[],
  agrupacion: string,
): Grupo[] {
  const cuenta = new Map<string, Grupo>();
  completas.forEach((f, i) => {
    const fila = filas[i];
    const [clave, etiqueta] = ((): [string | null, Valor] => {
      switch (agrupacion) {
        case 'ESTADO':
          return [f.solicitud.estado, fila.estado];
        case 'CONVOCATORIA':
          return [
            f.solicitud.convocatoriaId,
            f.convocatoria ? `${f.convocatoria.codigo} · ${f.convocatoria.titulo}` : null,
          ];
        case 'NIVEL':
          return [f.perfil?.nivel ?? null, fila.nivel];
        case 'DEPARTAMENTO':
          return [f.perfil?.departamento ?? null, fila.departamento];
        default:
          return [f.perfil?.centroEducativo?.toUpperCase() ?? null, fila.centroEducativo];
      }
    })();
    const k = clave ?? '—';
    const previo = cuenta.get(k);
    cuenta.set(k, {
      clave: k,
      etiqueta: previo?.etiqueta ?? (etiqueta === null ? SIN_DATO : String(etiqueta)),
      total: (previo?.total ?? 0) + 1,
    });
  });
  return [...cuenta.values()].sort(
    (a, b) => b.total - a.total || a.etiqueta.localeCompare(b.etiqueta),
  );
}
