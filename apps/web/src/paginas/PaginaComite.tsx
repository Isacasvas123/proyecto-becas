/**
 * PÁGINA `/comites/:id` — un comité: integrantes (US-017), asignación (US-018) y consolidado
 * (US-021). Solo administración.
 *
 * ASIGNAR
 *   - Automático: el reparto equitativo lo decide el servidor (tiene en cuenta la carga que cada
 *     integrante ya tenía). Aquí solo se elige cuántos evaluadores por solicitud.
 *   - Manual: una solicitud a la vez, eligiendo a quién.
 *   Asignar es irreversible desde esta pantalla —la solicitud pasa a EN_EVALUACION—, así que el
 *   reparto automático pide confirmación.
 *
 * EL CONSOLIDADO NO DECIDE
 *   Ordena y marca lo que cabría en los cupos. La decisión la toma el administrador fila por fila:
 *
 * RESOLVER Y ADJUDICAR (US-023, US-024)
 *   Desde cada fila del consolidado. Resolver exige elegir y escribir el motivo, y confirmar; los
 *   cupos disponibles se ven arriba en todo momento. Las reglas (dictámenes, cupo, transición) las
 *   aplica el servidor, que responde con el mensaje exacto.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  adjudicarBeca,
  confirmarAprobacion,
  agregarIntegrantes,
  quitarIntegrante,
  asignarSolicitudes,
  listarEvaluadores,
  obtenerComite,
  obtenerConsolidado,
  obtenerCupos,
  resolverSolicitud,
  solicitudesPorAsignar,
  type Comite,
  type Consolidado,
  type CuentaEvaluador,
  type Cupos,
  type FilaConsolidado,
  type SolicitudPorAsignar,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { cantidad, formatearFechaHora, nombreEstadoSolicitud, nombreTipo } from '../formato';

/**
 * «Queda 1 cupo libre», «Quedan 3 cupos libres», «Ya no quedan cupos».
 *
 * El último caso merece su propia frase: decir «quedan 0 cupos» es correcto y no se entiende
 * igual de rápido que decir que se acabaron.
 */
const cuposLibres = (disponibles: number): string =>
  disponibles === 0
    ? 'Ya no quedan cupos en la convocatoria.'
    : `${disponibles === 1 ? 'Queda' : 'Quedan'} ${cantidad(disponibles, 'cupo libre', 'cupos libres')}.`;

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
}

export function PaginaComite(): ReactElement {
  const { id = '' } = useParams();
  const [comite, setComite] = useState<Comite | null>(null);
  const [pendientes, setPendientes] = useState<SolicitudPorAsignar[]>([]);
  const [consolidado, setConsolidado] = useState<Consolidado | null>(null);
  const [evaluadores, setEvaluadores] = useState<CuentaEvaluador[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [porSolicitud, setPorSolicitud] = useState(1);
  const [confirmando, setConfirmando] = useState(false);
  const [manual, setManual] = useState<Record<string, string>>({});
  const [nuevoIntegrante, setNuevoIntegrante] = useState('');
  const [cupos, setCupos] = useState<Cupos | null>(null);
  const [seleccion, setSeleccion] = useState<FilaConsolidado | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [c, p, cons, ev] = await Promise.all([
        obtenerComite(id),
        solicitudesPorAsignar(id),
        obtenerConsolidado(id),
        listarEvaluadores(),
      ]);
      setComite(c);
      setPendientes(p);
      setConsolidado(cons);
      setCupos(await obtenerCupos(c.convocatoria.id));
      setEvaluadores(ev.filter((e) => e.activo));
      setErrorCarga(null);
    } catch (causa: unknown) {
      setErrorCarga(causa instanceof Error ? causa.message : 'No se pudo cargar el comité.');
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function ejecutar(accion: () => Promise<string>): Promise<void> {
    setAviso(null);
    setOcupado(true);
    try {
      const texto = await accion();
      await cargar();
      setAviso({ tipo: 'exito', texto });
    } catch (causa: unknown) {
      setAviso({
        tipo: 'error',
        texto:
          causa instanceof Error
            ? causa.message
            : 'No se pudo completar la acción. Revise su conexión y vuelva a intentarlo.',
      });
    } finally {
      setOcupado(false);
      setConfirmando(false);
    }
  }

  const repartir = () =>
    ejecutar(async () => {
      const r = await asignarSolicitudes(id, { modo: 'AUTOMATICO', porSolicitud });
      return `${cantidad(r.solicitudes, 'solicitud repartida', 'solicitudes repartidas')} en ${cantidad(r.asignaciones, 'asignación', 'asignaciones')}. Ya están en evaluación.`;
    });

  const asignarUna = (solicitud: SolicitudPorAsignar) =>
    ejecutar(async () => {
      const evaluadorId = manual[solicitud.id];
      await asignarSolicitudes(id, {
        modo: 'MANUAL',
        asignaciones: [
          { solicitudId: solicitud.id, evaluadorIds: evaluadorId ? [evaluadorId] : [] },
        ],
      });
      return `${solicitud.numero} asignada. Ya está en evaluación.`;
    });

  const agregar = () =>
    ejecutar(async () => {
      await agregarIntegrantes(id, [nuevoIntegrante]);
      setNuevoIntegrante('');
      return 'Integrante agregado.';
    });

  /**
   * CU-13, flujo 5a. El primer intento va sin confirmar: si esa persona tiene solicitudes
   * pendientes, el servidor responde cuántas quedarían sin evaluador y esa frase es la que se
   * muestra en el cuadro de confirmación. La pantalla no cuenta nada por su lado.
   */
  const quitar = (integrante: { id: string; nombreCompleto: string }) =>
    ejecutar(async () => {
      try {
        await quitarIntegrante(id, integrante.id);
        return `${integrante.nombreCompleto} ya no está en el comité.`;
      } catch (causa: unknown) {
        const aviso = causa instanceof Error ? causa.message : '';
        if (!/sin evaluador/.test(aviso)) throw causa;

        if (!window.confirm(`${aviso}\n\n¿Quitar a ${integrante.nombreCompleto} del comité?`)) {
          return `${integrante.nombreCompleto} sigue en el comité.`;
        }
        await quitarIntegrante(id, integrante.id, true);
        return `${integrante.nombreCompleto} ya no está en el comité. Sus solicitudes pendientes quedaron libres para reasignar.`;
      }
    });

  const resolver = (fila: FilaConsolidado, decision: 'APROBAR' | 'RECHAZAR', motivo: string) =>
    ejecutar(async () => {
      const r = await resolverSolicitud(fila.solicitudId, decision, motivo);
      setSeleccion(null);

      // El mensaje lo decide el estado que DEVOLVIÓ el servidor, no la decisión que se envió.
      // Una beca de más de Q10,000 no queda aprobada con esta firma: queda esperando la
      // segunda, y no descuenta cupo. Decir «aprobada» ahí haría creer que el trámite terminó.
      if (r.estado === 'APROBACION_PENDIENTE') {
        return `${r.numero} tiene la primera aprobación. Por el monto de la beca falta una segunda firma, de otra persona; el cupo se reserva hasta entonces.`;
      }

      return `${r.numero} ${decision === 'APROBAR' ? 'aprobada' : 'rechazada'}. ${cuposLibres(r.cupos.disponibles)}`;
    });

  /** PO, 17 Oct 2026: segunda firma de una beca que pasa de Q10,000. */
  const confirmarSegunda = (fila: FilaConsolidado, motivo: string) =>
    ejecutar(async () => {
      const r = await confirmarAprobacion(fila.solicitudId, motivo);
      setSeleccion(null);
      return `${r.numero} aprobada con la segunda firma. ${cuposLibres(r.cupos.disponibles)}`;
    });

  const adjudicar = (fila: FilaConsolidado) =>
    ejecutar(async () => {
      const r = await adjudicarBeca(fila.solicitudId);
      setSeleccion(null);
      return `${r.numero} adjudicada. Beca ${r.beca?.codigo ?? ''}.`;
    });

  const disponibles = evaluadores.filter(
    (e) => !(comite?.integrantes ?? []).some((i) => i.id === e.id),
  );

  return (
    <MarcoPrivado>
      <p className="migas">
        <Link to="/comites">← Comités</Link>
      </p>

      {errorCarga !== null && (
        <p className="aviso error" role="alert">
          {errorCarga}
        </p>
      )}

      {comite === null && errorCarga === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando comité" />
      )}

      {comite !== null && (
        <>
          <div className="barra-resultados">
            <div>
              <h1>{comite.nombre}</h1>
              <p className="conteo">
                <strong>{comite.convocatoria.codigo}</strong> · {comite.convocatoria.titulo} ·{' '}
                {nombreTipo(comite.convocatoria.tipo)} ·{' '}
                {cantidad(comite.convocatoria.cupos, 'cupo', 'cupos')}
              </p>
              {cupos !== null && (
                <p className="conteo">
                  <strong>{cupos.disponibles}</strong> cupos disponibles · {cupos.aprobadas}{' '}
                  aprobadas · {cupos.adjudicadas} adjudicadas
                </p>
              )}
              <p className="conteo">
                Criterio de puntaje: <strong>{comite.criterio}</strong> · creado por{' '}
                {comite.creadoPor} el {formatearFechaHora(comite.creadoEn)}
              </p>
            </div>
          </div>

          {aviso !== null && (
            <p className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
              {aviso.texto}
            </p>
          )}

          <div className="expediente">
            <section className="panel">
              <h2>Por asignar · {pendientes.length}</h2>
              {pendientes.length === 0 ? (
                <p className="nota-panel">No hay solicitudes enviadas esperando evaluador.</p>
              ) : (
                <>
                  <div className="reparto">
                    <label htmlFor="por-solicitud">Evaluadores por solicitud</label>
                    <select
                      id="por-solicitud"
                      value={porSolicitud}
                      onChange={(e) => setPorSolicitud(Number(e.target.value))}
                    >
                      {comite.integrantes.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    {!confirmando ? (
                      <button
                        type="button"
                        className="boton"
                        disabled={ocupado}
                        onClick={() => setConfirmando(true)}
                      >
                        Repartir todas
                      </button>
                    ) : (
                      <span className="confirmar-linea">
                        ¿Repartir {pendientes.length} y pasarlas a evaluación?
                        <button
                          type="button"
                          className="boton pequeno"
                          disabled={ocupado}
                          onClick={() => void repartir()}
                        >
                          {ocupado ? 'Repartiendo…' : 'Sí, repartir'}
                        </button>
                        <button
                          type="button"
                          className="boton pequeno fantasma"
                          disabled={ocupado}
                          onClick={() => setConfirmando(false)}
                        >
                          Cancelar
                        </button>
                      </span>
                    )}
                  </div>
                  <ul className="documentos">
                    {pendientes.map((s) => (
                      <li key={s.id}>
                        <div className="doc-texto">
                          <span className="doc-nombre">{s.numero}</span>
                          <span className="doc-detalle">
                            {s.enviadaEn !== null
                              ? `Enviada el ${formatearFechaHora(s.enviadaEn)}`
                              : ''}
                          </span>
                        </div>
                        <select
                          aria-label={`Evaluador para ${s.numero}`}
                          value={manual[s.id] ?? ''}
                          onChange={(e) => setManual({ ...manual, [s.id]: e.target.value })}
                        >
                          <option value="">Elegir evaluador…</option>
                          {comite.integrantes.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nombreCompleto} ({i.asignadas})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="boton pequeno fantasma"
                          disabled={ocupado || !manual[s.id]}
                          onClick={() => void asignarUna(s)}
                        >
                          Asignar
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <aside className="lateral">
              <section className="panel">
                <h2>Integrantes · {comite.integrantes.length}</h2>
                <ul className="documentos">
                  {comite.integrantes.map((i) => (
                    <li key={i.id}>
                      <div className="doc-texto">
                        <span className="doc-nombre">{i.nombreCompleto}</span>
                        <span className="doc-detalle">
                          {i.dictaminadas} de {i.asignadas} dictaminadas
                        </span>
                      </div>
                      {comite.integrantes.length > 1 && (
                        <button
                          type="button"
                          className="boton pequeno fantasma"
                          disabled={ocupado}
                          onClick={() => void quitar(i)}
                          aria-label={`Quitar a ${i.nombreCompleto} del comité`}
                        >
                          Quitar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {disponibles.length > 0 && (
                  <div className="reparto">
                    <select
                      aria-label="Evaluador para agregar"
                      value={nuevoIntegrante}
                      onChange={(e) => setNuevoIntegrante(e.target.value)}
                    >
                      <option value="">Agregar integrante…</option>
                      {disponibles.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombreCompleto}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="boton pequeno fantasma"
                      disabled={ocupado || nuevoIntegrante === ''}
                      onClick={() => void agregar()}
                    >
                      Agregar
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>

          {consolidado !== null && (
            <section className="panel">
              <h2>
                Consolidado · {consolidado.completas} de {consolidado.filas.length} con todos sus
                dictámenes
              </h2>
              {consolidado.filas.length === 0 ? (
                <p className="nota-panel">Todavía no hay solicitudes asignadas.</p>
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th scope="col" className="num">
                          Lugar
                        </th>
                        <th scope="col">Solicitud</th>
                        <th scope="col">Estudiante</th>
                        <th scope="col">Estado</th>
                        <th scope="col" className="num">
                          Dictámenes
                        </th>
                        <th scope="col" className="num">
                          A favor / en contra
                        </th>
                        <th scope="col" className="num">
                          Puntaje
                        </th>
                        <th scope="col">
                          <span className="solo-lector">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consolidado.filas.map((f) => (
                        <tr key={f.solicitudId} className={f.dentroDeCupos ? 'en-cupo' : undefined}>
                          <td className="num">{f.posicion ?? '—'}</td>
                          <td className="codigo">{f.numero}</td>
                          <td>{f.estudiante}</td>
                          <td>
                            <span className={`estado e-${f.estado.toLowerCase()}`}>
                              {nombreEstadoSolicitud(f.estado)}
                            </span>
                          </td>
                          <td className="num">
                            {f.dictamenesEmitidos} de {f.evaluadoresAsignados}
                          </td>
                          <td className="num">
                            {f.favorables} / {f.desfavorables}
                          </td>
                          <td className="num">
                            <strong>{f.puntajePromedio?.toFixed(2) ?? 'Pendiente'}</strong>
                          </td>
                          <td className="accion">
                            {f.estado === 'EN_EVALUACION' && f.dictamenesEmitidos > 0 && (
                              <button
                                type="button"
                                className="boton pequeno fantasma"
                                disabled={ocupado}
                                onClick={() => setSeleccion(f)}
                              >
                                Resolver
                              </button>
                            )}
                            {f.estado === 'APROBACION_PENDIENTE' && (
                              <button
                                type="button"
                                className="boton pequeno"
                                disabled={ocupado}
                                onClick={() => setSeleccion(f)}
                              >
                                Segunda aprobación
                              </button>
                            )}
                            {f.estado === 'APROBADA' && (
                              <button
                                type="button"
                                className="boton pequeno"
                                disabled={ocupado}
                                onClick={() => setSeleccion(f)}
                              >
                                Adjudicar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {seleccion !== null && (
                <PanelDecision
                  key={seleccion.solicitudId}
                  fila={seleccion}
                  disponibles={cupos?.disponibles ?? 0}
                  ocupado={ocupado}
                  onResolver={(decision, motivo) => void resolver(seleccion, decision, motivo)}
                  onAdjudicar={() => void adjudicar(seleccion)}
                  onConfirmarSegunda={(motivo) => void confirmarSegunda(seleccion, motivo)}
                  onCancelar={() => setSeleccion(null)}
                />
              )}
              <p className="nota-panel">
                Las filas resaltadas caben en {cantidad(consolidado.cupos, 'el cupo', 'los cupos')}{' '}
                de la convocatoria. Es una referencia: la aprobación la decide el administrador en
                la resolución.
              </p>
            </section>
          )}
        </>
      )}
    </MarcoPrivado>
  );
}

const MINIMO_MOTIVO = 15;

interface PropsDecision {
  fila: FilaConsolidado;
  disponibles: number;
  ocupado: boolean;
  onResolver: (decision: 'APROBAR' | 'RECHAZAR', motivo: string) => void;
  onAdjudicar: () => void;
  /** PO, 17 Oct 2026. */
  onConfirmarSegunda: (motivo: string) => void;
  onCancelar: () => void;
}

/**
 * La decisión sobre UNA solicitud. Para resolver: elegir, escribir el motivo y confirmar. Para
 * adjudicar: confirmar. Las dos son irreversibles, por eso piden dos pasos.
 */
function PanelDecision({
  fila,
  disponibles,
  ocupado,
  onResolver,
  onAdjudicar,
  onConfirmarSegunda,
  onCancelar,
}: PropsDecision): ReactElement {
  const [decision, setDecision] = useState<'APROBAR' | 'RECHAZAR' | ''>('');
  const [motivo, setMotivo] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const largo = motivo.trim().length;
  const adjudicando = fila.estado === 'APROBADA';
  // PO, 17 Oct 2026: la beca pasó del umbral y espera una segunda firma, que debe dar otra persona.
  const confirmandoSegunda = fila.estado === 'APROBACION_PENDIENTE';

  return (
    <div className="decision" role="region" aria-label={`Decisión sobre ${fila.numero}`}>
      <h3>
        {adjudicando ? 'Adjudicar beca' : confirmandoSegunda ? 'Segunda aprobación' : 'Resolver'} ·{' '}
        {fila.numero} · {fila.estudiante}
      </h3>
      <p className="pista">
        Puntaje {fila.puntajePromedio?.toFixed(2) ?? '—'} · {fila.favorables} a favor y{' '}
        {fila.desfavorables} en contra · {fila.dictamenesEmitidos} de {fila.evaluadoresAsignados}{' '}
        dictámenes · {cantidad(disponibles, 'cupo disponible', 'cupos disponibles')}
      </p>

      {adjudicando ? (
        <p>
          Se registrará la beca con su código y la solicitud quedará <strong>adjudicada</strong>.
        </p>
      ) : confirmandoSegunda ? (
        <>
          <p>
            Esta beca supera los <strong>Q10,000</strong>, así que necesita una segunda aprobación.
            Ya tiene la primera: al confirmar quedará <strong>aprobada</strong> y se reservará el
            cupo.
          </p>
          <p className="pista">
            La segunda firma debe darla una persona distinta de la que aprobó primero. Si es la
            misma, el sistema lo rechaza.
          </p>
        </>
      ) : (
        <>
          {fila.dictamenesEmitidos < fila.evaluadoresAsignados && (
            <p className="aviso pendiente">
              Todavía faltan dictámenes de este comité. Puede resolver, pero considere esperarlos.
            </p>
          )}
          <fieldset className="opciones en-linea">
            <legend>Decisión</legend>
            <label>
              <input
                type="radio"
                name="decision"
                checked={decision === 'APROBAR'}
                disabled={disponibles === 0}
                onChange={() => setDecision('APROBAR')}
              />
              Aprobar {disponibles === 0 && <span className="cuenta">(sin cupos)</span>}
            </label>
            <label>
              <input
                type="radio"
                name="decision"
                checked={decision === 'RECHAZAR'}
                onChange={() => setDecision('RECHAZAR')}
              />
              Rechazar
            </label>
          </fieldset>
          <div className="campo">
            <label htmlFor="motivo">Motivo</label>
            <textarea
              id="motivo"
              rows={3}
              maxLength={2000}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="El estudiante lo verá en el historial de su solicitud."
            />
            <span className={`pista ${largo > 0 && largo < MINIMO_MOTIVO ? 'alerta' : ''}`}>
              Obligatorio, al menos {MINIMO_MOTIVO} caracteres (lleva {largo}).
            </span>
          </div>
        </>
      )}

      <div className="acciones">
        <button type="button" className="boton fantasma" disabled={ocupado} onClick={onCancelar}>
          Cancelar
        </button>
        {!confirmando ? (
          <button
            type="button"
            className="boton"
            disabled={
              ocupado ||
              (confirmandoSegunda && largo < MINIMO_MOTIVO) ||
              (!adjudicando && !confirmandoSegunda && (decision === '' || largo < MINIMO_MOTIVO))
            }
            onClick={() => setConfirmando(true)}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            className="boton"
            disabled={ocupado}
            onClick={() => {
              if (adjudicando) return onAdjudicar();
              if (confirmandoSegunda) return onConfirmarSegunda(motivo);
              if (decision !== '') onResolver(decision, motivo);
            }}
          >
            {ocupado
              ? 'Guardando…'
              : adjudicando
                ? 'Sí, adjudicar'
                : confirmandoSegunda
                  ? 'Sí, aprobar en segunda firma'
                  : `Sí, ${decision === 'APROBAR' ? 'aprobar' : 'rechazar'}`}
          </button>
        )}
      </div>
      {confirmando && <p className="pista">Esta decisión no se puede deshacer desde el sistema.</p>}
    </div>
  );
}
