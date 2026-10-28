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
  SolicitudResumida,
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

  /**
   * US-017, CU-13 flujo 5a — quitar a un integrante.
   *
   * El flujo pide avisar **cuántas solicitudes quedarían sin evaluador** y pedir confirmación
   * explícita. Por eso `confirmado` es parte del comando y no un detalle de la interfaz: sin él,
   * la operación se rechaza y el mensaje trae la cuenta. Así el aviso existe también para quien
   * llame a la API directamente, no solo para quien use la pantalla.
   *
   * LOS DICTÁMENES YA EMITIDOS NO SE TOCAN
   *   Si la persona ya dictaminó alguna de sus solicitudes, se le quita del comité pero esas
   *   asignaciones se conservan: un dictamen es un registro de auditoría (US-019, criterio 4) y
   *   borrar su asignación dejaría un dictamen huérfano en el consolidado. Solo se borran las
   *   asignaciones **pendientes**, que son las que de verdad quedan sin evaluador.
   */
  async quitarEvaluador(id: string, evaluadorId: string, confirmado: boolean): Promise<ComiteDto> {
    const comite = await this.cargar(id);
    if (!comite.esIntegrante(evaluadorId)) {
      throw new ReglaDeNegocioError('Esa persona no forma parte del comité.');
    }

    const pendientes = await this.solicitudesSinDictamen(comite.id, evaluadorId);

    if (pendientes.length > 0 && !confirmado) {
      throw new ReglaDeNegocioError(
        `${pendientes.length} ${pendientes.length === 1 ? 'solicitud quedaría' : 'solicitudes quedarían'} sin evaluador. Confirme para continuar.`,
      );
    }

    comite.quitarEvaluador(evaluadorId);
    await this.comites.guardar(comite);
    if (pendientes.length > 0) {
      await this.comites.eliminarAsignaciones(comite.id, evaluadorId, pendientes);
    }

    this.logger.warn(
      `Evaluador ${evaluadorId} retirado del comité ${comite.id}; ${pendientes.length} asignación(es) pendiente(s) liberada(s)`,
    );
    return this.presentar(comite);
  }

  /** Cuántas de sus solicitudes asignadas en este comité siguen sin dictamen suyo. */
  private async solicitudesSinDictamen(comiteId: string, evaluadorId: string): Promise<string[]> {
    const asignadas = (await this.comites.asignacionesDeComite(comiteId))
      .filter((a) => a.evaluadorId === evaluadorId)
      .map((a) => a.solicitudId);
    if (asignadas.length === 0) return [];

    const dictaminadas = new Set(
      (await this.dictamenes.deEvaluador(evaluadorId)).map((d) => d.solicitudId),
    );
    return asignadas.filter((solicitudId) => !dictaminadas.has(solicitudId));
  }

  /**
   * US-018, criterio 1: lo que se puede asignar son las ENVIADAS de la convocatoria.
   *
   * Y además las que quedaron **EN_EVALUACION sin ningún evaluador**, que es lo que puede pasar
   * al quitar a un integrante (CU-13, 5a). Si no aparecieran aquí serían invisibles: nadie las
   * evaluaría y nadie podría reasignarlas. No vuelven a ENVIADA porque el ciclo de vida solo
   * avanza (patrón State).
   */
  async porAsignar(id: string): Promise<SolicitudPorAsignarDto[]> {
    const comite = await this.cargar(id);
    const asignables = await this.asignables(comite);
    return asignables.map((s) => ({ id: s.id, numero: s.numero, enviadaEn: s.enviadaEn }));
  }

  private async asignables(comite: Comite): Promise<SolicitudResumida[]> {
    const [enviadas, enEvaluacion, asignaciones] = await Promise.all([
      this.solicitudes.enviadasDe(comite.convocatoriaId),
      this.solicitudes.enEvaluacionDe(comite.convocatoriaId),
      this.comites.asignacionesDeComite(comite.id),
    ]);
    const conEvaluador = new Set(asignaciones.map((a) => a.solicitudId));
    const huerfanas = enEvaluacion.filter((s) => !conEvaluador.has(s.id));
    return [...enviadas, ...huerfanas];
  }

  async asignar(
    id: string,
    comando: ComandoAsignar,
    adminId: string,
    ahora: Date = new Date(),
  ): Promise<ResultadoAsignacionDto> {
    const comite = await this.cargar(id);
    const asignables = await this.asignables(comite);
    const permitidas = new Set(asignables.map((s) => s.id));
    // Solo las que siguen ENVIADAS cambian de estado: las huérfanas ya están EN_EVALUACION y
    // volver a iniciarlas sería una transición inválida.
    const porIniciar = new Set(asignables.filter((s) => s.estado === 'ENVIADA').map((s) => s.id));

    let plan: { solicitudId: string; evaluadorId: string }[];

    if (comando.modo === 'AUTOMATICO') {
      const carga = new Map<string, number>();
      for (const a of await this.comites.asignacionesDeComite(comite.id)) {
        carga.set(a.evaluadorId, (carga.get(a.evaluadorId) ?? 0) + 1);
      }
      plan = comite.repartir([...permitidas], comando.porSolicitud, carga);
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
        if (!permitidas.has(solicitudId)) {
          throw new ReglaDeNegocioError(
            'Solo se asignan solicitudes ENVIADAS de la convocatoria de este comité, o las que quedaron sin evaluador.',
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
    const aIniciar = solicitudIds.filter((sid) => porIniciar.has(sid));

    const asignaciones: Asignacion[] = plan.map((p) => ({
      ...p,
      comiteId: comite.id,
      asignadaPor: adminId,
      asignadaEn: ahora,
    }));
    await this.comites.guardarAsignaciones(asignaciones);
    if (aIniciar.length > 0) {
      await this.solicitudes.iniciarEvaluacion(aIniciar, comite.convocatoriaId, adminId);
    }

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
