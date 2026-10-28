/**
 * Página `/comites` — comités evaluadores (US-017, CU-13). Solo administración.
 *
 * Una convocatoria tiene un solo comité (3a): el formulario solo ofrece las convocatorias que
 * todavía no tienen uno. Si no hay evaluadores, lo dice y lleva a crearlos (4a).
 */
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  crearComite,
  listarComites,
  listarConvocatoriasGestion,
  listarEvaluadores,
  type Comite,
  type Convocatoria,
  type CuentaEvaluador,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { formatearFecha } from '../formato';

export function PaginaComites(): ReactElement {
  const navegar = useNavigate();
  const [comites, setComites] = useState<Comite[] | null>(null);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [evaluadores, setEvaluadores] = useState<CuentaEvaluador[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([listarComites(), listarConvocatoriasGestion(), listarEvaluadores()])
      .then(([c, conv, ev]) => {
        setComites(c);
        setConvocatorias(conv);
        setEvaluadores(ev.filter((e) => e.activo));
      })
      .catch((causa: unknown) =>
        setErrorCarga(causa instanceof Error ? causa.message : 'No se pudieron cargar.'),
      );
  }, []);

  const sinComite = useMemo(() => {
    const ocupadas = new Set((comites ?? []).map((c) => c.convocatoria.id));
    return convocatorias.filter((c) => c.estado !== 'BORRADOR' && !ocupadas.has(c.id));
  }, [comites, convocatorias]);

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const creado = await crearComite({ nombre, convocatoriaId, evaluadorIds: elegidos });
      navegar(`/comites/${creado.id}`);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear el comité.');
      setGuardando(false);
    }
  }

  const alternar = (id: string) =>
    setElegidos((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));

  return (
    <MarcoPrivado>
      <div className="barra-resultados">
        <div>
          <h1>Comités evaluadores</h1>
          {comites !== null && (
            <p className="conteo">
              <strong>{comites.length}</strong> {comites.length === 1 ? 'comité' : 'comités'}
            </p>
          )}
        </div>
        {!creando && comites !== null && (
          <button type="button" className="boton" onClick={() => setCreando(true)}>
            Nuevo comité
          </button>
        )}
      </div>

      {creando && (
        <form className="panel formulario-convocatoria" onSubmit={(e) => void guardar(e)}>
          <div className="encabezado-form">
            <h2>Nuevo comité</h2>
            <p className="sub">
              Sus integrantes podrán ver los datos y documentos de los aspirantes de esa
              convocatoria. Elíjalos con cuidado.
            </p>
          </div>

          {evaluadores.length === 0 ? (
            <p className="aviso pendiente">
              Todavía no hay cuentas de evaluador activas.{' '}
              <Link to="/evaluadores">Cree al menos una</Link> antes de formar un comité.
            </p>
          ) : (
            <>
              <div className="rejilla">
                <div className="campo">
                  <label htmlFor="comite-nombre">Nombre</label>
                  <input
                    id="comite-nombre"
                    required
                    maxLength={120}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Comité de becas universitarias 2026"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="comite-convocatoria">Convocatoria</label>
                  <select
                    id="comite-convocatoria"
                    required
                    value={convocatoriaId}
                    onChange={(e) => setConvocatoriaId(e.target.value)}
                  >
                    <option value="">Seleccione…</option>
                    {sinComite.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} · {c.titulo}
                      </option>
                    ))}
                  </select>
                  {sinComite.length === 0 && (
                    <span className="pista">
                      Todas las convocatorias publicadas ya tienen comité.
                    </span>
                  )}
                </div>
              </div>
              <fieldset className="opciones">
                <legend>
                  Integrantes <span className="cuenta">{elegidos.length}</span>
                </legend>
                {evaluadores.map((e) => (
                  <label key={e.id}>
                    <input
                      type="checkbox"
                      checked={elegidos.includes(e.id)}
                      onChange={() => alternar(e.id)}
                    />
                    {e.nombreCompleto} <span className="cuenta">{e.nombreUsuario}</span>
                  </label>
                ))}
              </fieldset>
            </>
          )}

          {error !== null && (
            <p className="aviso error" role="alert">
              {error}
            </p>
          )}

          <div className="acciones">
            <button
              type="button"
              className="boton fantasma"
              disabled={guardando}
              onClick={() => setCreando(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton"
              disabled={guardando || evaluadores.length === 0 || elegidos.length === 0}
            >
              {guardando ? 'Creando…' : 'Crear comité'}
            </button>
          </div>
        </form>
      )}

      {errorCarga !== null && (
        <p className="aviso error" role="alert">
          {errorCarga}
        </p>
      )}

      {comites === null && errorCarga === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando comités" />
      )}

      {comites !== null && comites.length === 0 && !creando && (
        <p className="aviso">Todavía no hay comités. Cree el primero.</p>
      )}

      {comites !== null && comites.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Comité</th>
                <th scope="col">Convocatoria</th>
                <th scope="col" className="num">
                  Integrantes
                </th>
                <th scope="col" className="num">
                  Dictámenes
                </th>
                <th scope="col">Creado</th>
                <th scope="col">
                  <span className="solo-lector">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comites.map((c) => {
                const asignadas = c.integrantes.reduce((s, i) => s + i.asignadas, 0);
                const hechas = c.integrantes.reduce((s, i) => s + i.dictaminadas, 0);
                return (
                  <tr key={c.id}>
                    <td className="titulo-fila">{c.nombre}</td>
                    <td>
                      <span className="codigo">{c.convocatoria.codigo}</span>
                      <div className="pista-fila">{c.convocatoria.titulo}</div>
                    </td>
                    <td className="num">{c.integrantes.length}</td>
                    <td className="num">
                      {hechas} de {asignadas}
                    </td>
                    <td>{formatearFecha(c.creadoEn)}</td>
                    <td className="accion">
                      <Link to={`/comites/${c.id}`} className="boton pequeno fantasma">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </MarcoPrivado>
  );
}
