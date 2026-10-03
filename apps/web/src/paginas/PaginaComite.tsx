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
 *   Ordena y marca lo que cabría en los cupos. Aprobar o rechazar es US-023.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  agregarIntegrantes,
  asignarSolicitudes,
  listarEvaluadores,
  obtenerComite,
  obtenerConsolidado,
  solicitudesPorAsignar,
  type Comite,
  type Consolidado,
  type CuentaEvaluador,
  type SolicitudPorAsignar,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { formatearFechaHora, nombreEstadoSolicitud, nombreTipo } from '../formato';

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
      setAviso({ tipo: 'error', texto: causa instanceof Error ? causa.message : 'No se pudo.' });
    } finally {
      setOcupado(false);
      setConfirmando(false);
    }
  }

  const repartir = () =>
    ejecutar(async () => {
      const r = await asignarSolicitudes(id, { modo: 'AUTOMATICO', porSolicitud });
      return `${r.solicitudes} solicitud(es) repartidas en ${r.asignaciones} asignación(es). Ya están en evaluación.`;
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
                {nombreTipo(comite.convocatoria.tipo)} · {comite.convocatoria.cupos} cupos
              </p>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="nota-panel">
                Las filas resaltadas caben en los {consolidado.cupos} cupos de la convocatoria. Es
                una referencia: la aprobación la decide el administrador en la resolución.
              </p>
            </section>
          )}
        </>
      )}
    </MarcoPrivado>
  );
}
