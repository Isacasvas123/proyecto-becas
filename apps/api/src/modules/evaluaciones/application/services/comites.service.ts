/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-017 — Crear comité evaluador (CU-13) y US-018 — asignar solicitudes.
 *
 * ORDEN AL ASIGNAR (US-018)
 *   1. Se valida TODO: que cada solicitud esté ENVIADA en esta convocatoria, que cada evaluador sea
 *      integrante y que ninguna quede sin evaluador (criterios 1 y 2).
 *   2. Se guardan las asignaciones.
 *   3. Las solicitudes pasan a EN_EVALUACION (criterio 3).
 *   Si el paso 3 fallara a medias, las solicitudes que siguen ENVIADAS vuelven a aparecer como
 *   pendientes y repetir la asignación es seguro: las asignaciones ya guardadas se ignoran. El
 *   orden inverso sería peor: una solicitud EN_EVALUACION sin nadie que la evalúe.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import { Asignacion, Comite } from '../../domain/entities/comite.entity';
import { COMITE_REPOSITORIO, ComiteRepositorio } from '../../domain/ports/comite.repositorio';
import {
  CONSULTA_CONVOCATORIAS_EVALUACION,
  CONSULTA_CUENTAS,
  CONSULTA_SOLICITUDES,
  ConsultaConvocatoriasEvaluacion,
  ConsultaCuentas,
  ConsultaSolicitudes,
  Persona,
} from '../../domain/ports/consultas-externas';
import { DICTAMEN_REPOSITORIO, DictamenRepositorio } from '../../domain/ports/dictamen.repositorio';
import { criterioPara } from '../../domain/strategies/criterio-por-tipo-beca';
import { ComiteDto, ResultadoAsignacionDto, SolicitudPorAsignarDto } from '../dto/evaluaciones.dto';

export interface ComandoCrearComite {
  readonly nombre: string;
  readonly convocatoriaId: string;
  readonly evaluadorIds: readonly string[];
}

export type ComandoAsignar =
  | { readonly modo: 'AUTOMATICO'; readonly porSolicitud: number }
  | {
      readonly modo: 'MANUAL';
      readonly asignaciones: readonly { solicitudId: string; evaluadorIds: readonly string[] }[];
    };

@Injectable()
export class ComitesService {
  private readonly logger = new Logger(ComitesService.name);

  constructor(
    @Inject(COMITE_REPOSITORIO)
    private readonly comites: ComiteRepositorio,
    @Inject(DICTAMEN_REPOSITORIO)
    private readonly dictamenes: DictamenRepositorio,
    @Inject(CONSULTA_CONVOCATORIAS_EVALUACION)
    private readonly convocatorias: ConsultaConvocatoriasEvaluacion,
    @Inject(CONSULTA_CUENTAS)
    private readonly cuentas: ConsultaCuentas,
    @Inject(CONSULTA_SOLICITUDES)
    private readonly solicitudes: ConsultaSolicitudes,
  ) {}

  async crear(
    comando: ComandoCrearComite,
    adminId: string,
    ahora: Date = new Date(),
  ): Promise<ComiteDto> {
    const convocatoria = await this.convocatorias.buscar(comando.convocatoriaId);
    if (convocatoria === null) {
      throw new RecursoNoEncontradoError('No existe esa convocatoria.');
    }

    const existente = await this.comites.buscarPorConvocatoria(comando.convocatoriaId);
    if (existente !== null) {
      throw new RecursoDuplicadoError(
        `La convocatoria ${convocatoria.codigo} ya tiene un comité: «${existente.nombre}». Agregue integrantes a ese.`,
      );
    }

    await this.validarEvaluadores(comando.evaluadorIds);

    const comite = Comite.nuevo({
      id: randomUUID(),
      nombre: comando.nombre,
      convocatoriaId: comando.convocatoriaId,
      evaluadores: comando.evaluadorIds,
      creadoPor: adminId,
      creadoEn: ahora,
    });
    await this.comites.guardar(comite);
    this.logger.log(`Comité creado: ${comite.nombre} (${convocatoria.codigo}) por ${adminId}`);

    return this.presentar(comite);
  }

  async listar(): Promise<ComiteDto[]> {
    return Promise.all((await this.comites.listar()).map((c) => this.presentar(c)));
  }

  async detalle(id: string): Promise<ComiteDto> {
    return this.presentar(await this.cargar(id));
  }

  async agregarEvaluadores(id: string, evaluadorIds: readonly string[]): Promise<ComiteDto> {
    const comite = await this.cargar(id);
    await this.validarEvaluadores(evaluadorIds);
    comite.agregarEvaluadores(evaluadorIds);
    await this.comites.guardar(comite);
    return this.presentar(comite);
  }

  /** US-018, criterio 1: lo que se puede asignar son las ENVIADAS de la convocatoria. */
  async porAsignar(id: string): Promise<SolicitudPorAsignarDto[]> {
    const comite = await this.cargar(id);
    const enviadas = await this.solicitudes.enviadasDe(comite.convocatoriaId);
    return enviadas.map((s) => ({ id: s.id, numero: s.numero, enviadaEn: s.enviadaEn }));
  }

  async asignar(
    id: string,
    comando: ComandoAsignar,
    adminId: string,
    ahora: Date = new Date(),
  ): Promise<ResultadoAsignacionDto> {
    const comite = await this.cargar(id);
    const enviadas = new Set(
      (await this.solicitudes.enviadasDe(comite.convocatoriaId)).map((s) => s.id),
    );

    let plan: { solicitudId: string; evaluadorId: string }[];

    if (comando.modo === 'AUTOMATICO') {
      const carga = new Map<string, number>();
      for (const a of await this.comites.asignacionesDeComite(comite.id)) {
        carga.set(a.evaluadorId, (carga.get(a.evaluadorId) ?? 0) + 1);
      }
      plan = comite.repartir([...enviadas], comando.porSolicitud, carga);
    } else {
      plan = [];
      for (const { solicitudId, evaluadorIds } of comando.asignaciones) {
        if (evaluadorIds.length === 0) {
          throw new ReglaDeNegocioError('Cada solicitud debe asignarse al menos a un evaluador.');
        }
        const ajenos = evaluadorIds.filter((e) => !comite.esIntegrante(e));
        if (ajenos.length > 0) {
          throw new ReglaDeNegocioError('Solo se asigna a integrantes de este comité.');
        }
        if (!enviadas.has(solicitudId)) {
          throw new ReglaDeNegocioError(
            'Solo se asignan solicitudes ENVIADAS de la convocatoria de este comité.',
          );
        }
        for (const evaluadorId of new Set(evaluadorIds)) {
          plan.push({ solicitudId, evaluadorId });
        }
      }
    }

    const solicitudIds = [...new Set(plan.map((p) => p.solicitudId))];
    if (solicitudIds.length === 0) {
      throw new ReglaDeNegocioError('No hay solicitudes enviadas pendientes de asignar.');
    }

    const asignaciones: Asignacion[] = plan.map((p) => ({
      ...p,
      comiteId: comite.id,
      asignadaPor: adminId,
      asignadaEn: ahora,
    }));
    await this.comites.guardarAsignaciones(asignaciones);
    await this.solicitudes.iniciarEvaluacion(solicitudIds, comite.convocatoriaId, adminId);

    this.logger.log(
      `Comité ${comite.nombre}: ${solicitudIds.length} solicitud(es), ${asignaciones.length} asignación(es)`,
    );
    return { solicitudes: solicitudIds.length, asignaciones: asignaciones.length };
  }

  private async cargar(id: string): Promise<Comite> {
    const comite = await this.comites.buscarPorId(id);
    if (comite === null) {
      throw new RecursoNoEncontradoError('No existe ese comité.');
    }
    return comite;
  }

  /** Que existan, que sean EVALUADOR y que estén activos. CU-13, 4a. */
  private async validarEvaluadores(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      const hay = (await this.cuentas.evaluadores()).length > 0;
      throw new ReglaDeNegocioError(
        hay
          ? 'Un comité necesita al menos un evaluador.'
          : 'Todavía no hay cuentas de evaluador. Cree al menos una antes de formar un comité.',
      );
    }
    const personas = await this.cuentas.personas(ids);
    const validos = new Set(
      personas.filter((p) => p.rol === 'EVALUADOR' && p.activo).map((p) => p.id),
    );
    const invalidos = ids.filter((id) => !validos.has(id));
    if (invalidos.length > 0) {
      throw new ReglaDeNegocioError(
        `${invalidos.length} de las personas elegidas no es una cuenta de evaluador activa.`,
      );
    }
  }

  private async presentar(comite: Comite): Promise<ComiteDto> {
    const [convocatoria, personas, asignaciones] = await Promise.all([
      this.convocatorias.buscar(comite.convocatoriaId),
      this.cuentas.personas([...comite.evaluadores, comite.creadoPor]),
      this.comites.asignacionesDeComite(comite.id),
    ]);
    const dictamenes = await this.dictamenes.deSolicitudes([
      ...new Set(asignaciones.map((a) => a.solicitudId)),
    ]);
    const porId = new Map<string, Persona>(personas.map((p) => [p.id, p]));

    return {
      id: comite.id,
      nombre: comite.nombre,
      convocatoria: {
        id: comite.convocatoriaId,
        codigo: convocatoria?.codigo ?? '',
        titulo: convocatoria?.titulo ?? 'Convocatoria no disponible',
        tipo: convocatoria?.tipo ?? '',
        cupos: convocatoria?.cupos ?? 0,
      },
      criterio: convocatoria !== null ? criterioPara(convocatoria.tipo).nombre : '',
      integrantes: comite.evaluadores.map((id) => ({
        id,
        nombreCompleto: porId.get(id)?.nombreCompleto ?? 'Cuenta no disponible',
        nombreUsuario: porId.get(id)?.nombreUsuario ?? '',
        asignadas: asignaciones.filter((a) => a.evaluadorId === id).length,
        dictaminadas: dictamenes.filter((d) => d.evaluadorId === id).length,
      })),
      creadoPor: porId.get(comite.creadoPor)?.nombreCompleto ?? comite.creadoPor,
      creadoEn: comite.creadoEn.toISOString(),
    };
  }
}
