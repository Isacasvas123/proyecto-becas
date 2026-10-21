/**
 * PÁGINA `/bitacora` — auditoría del sistema. Solo administración.
 *
 * Exigida por el Product Owner el 17 de octubre de 2026. Muestra quién hizo qué, sobre qué y
 * cómo terminó, con filtros por rol, entidad, fechas y solo rechazadas.
 *
 * NO MUESTRA DATOS PERSONALES, porque la bitácora no los guarda: identifica al actor por su
 * nombre de usuario y al recurso por su identificador. Quien necesite el dato de una persona lo
 * busca donde vive, con los permisos de esa pantalla.
 *
 * Abrir esta página también queda registrado: consultar una auditoría es, en sí, una acción
 * auditable.
 */
import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';

import {
  consultarBitacora,
  entidadesBitacora,
  type FiltrosBitacora,
  type PaginaBitacora as Pagina,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { formatearFechaHora } from '../formato';

const ROLES: [string, string][] = [
  ['ADMINISTRADOR', 'Administrador'],
  ['EVALUADOR', 'Evaluador'],
  ['ESTUDIANTE', 'Estudiante'],
];

const vacíos = (filtros: FiltrosBitacora): FiltrosBitacora =>
  Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== undefined));

export function PaginaBitacora(): ReactElement {
  const [filtros, setFiltros] = useState<FiltrosBitacora>({});
  const [aplicados, setAplicados] = useState<FiltrosBitacora>({});
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<Pagina | null>(null);
  const [entidades, setEntidades] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    entidadesBitacora()
      .then(setEntidades)
      .catch(() => setEntidades([]));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDatos(await consultarBitacora({ ...aplicados, pagina: String(pagina) }));
      setError(null);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo consultar la bitácora.');
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [aplicados, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setPagina(1);
    setAplicados(vacíos(filtros));
  };

  const limpiar = () => {
    setFiltros({});
    setPagina(1);
    setAplicados({});
  };

  const cambiar = (campo: keyof FiltrosBitacora, valor: string) =>
    setFiltros((previos) => ({ ...previos, [campo]: valor }));

  return (
    <MarcoPrivado>
      <section className="contenido">
        <header className="encabezado-pagina">
          <h1>Bitácora</h1>
          <p className="descripcion">
            Registro de toda acción que cambia algo en el sistema, y de los intentos de acceso. Solo
            se inserta: ningún registro se puede modificar ni borrar desde la aplicación.
          </p>
        </header>

        <form className="panel filtros-reporte" onSubmit={aplicar}>
          <div className="rejilla tres">
            <label className="campo">
              <span>Rol</span>
              <select value={filtros.rol ?? ''} onChange={(e) => cambiar('rol', e.target.value)}>
                <option value="">Todos</option>
                {ROLES.map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>Recurso</span>
              <select
                value={filtros.entidad ?? ''}
                onChange={(e) => cambiar('entidad', e.target.value)}
              >
                <option value="">Todos</option>
                {entidades.map((entidad) => (
                  <option key={entidad} value={entidad}>
                    {entidad}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>Solo rechazadas</span>
              <select
                value={filtros.soloRechazadas ?? ''}
                onChange={(e) => cambiar('soloRechazadas', e.target.value)}
              >
                <option value="">No</option>
                <option value="true">Sí</option>
              </select>
            </label>

            <label className="campo">
              <span>Desde</span>
              <input
                type="date"
                value={filtros.desde ?? ''}
                onChange={(e) => cambiar('desde', e.target.value)}
              />
            </label>

            <label className="campo">
              <span>Hasta</span>
              <input
                type="date"
                value={filtros.hasta ?? ''}
                onChange={(e) => cambiar('hasta', e.target.value)}
              />
            </label>
          </div>

          <div className="exportar">
            <button type="submit" className="boton" disabled={cargando}>
              {cargando ? 'Consultando…' : 'Aplicar filtros'}
            </button>
            <button type="button" className="boton fantasma" onClick={limpiar} disabled={cargando}>
              Limpiar
            </button>
          </div>
        </form>

        {error !== null && (
          <p className="aviso error" role="alert">
            {error}
          </p>
        )}

        {datos !== null && (
          <section className="panel">
            <div className="encabezado-reporte">
              <p>
                <strong>{datos.total}</strong> {datos.total === 1 ? 'registro' : 'registros'} ·
                página {datos.pagina} de {datos.paginas}
              </p>
            </div>

            {datos.registros.length === 0 ? (
              <p className="nota-panel">No hay registros con esos filtros.</p>
            ) : (
              <div className="tabla-envoltura">
                <table className="tabla reporte">
                  <thead>
                    <tr>
                      <th>Cuándo</th>
                      <th>Quién</th>
                      <th>Acción</th>
                      <th>Recurso</th>
                      <th>Resultado</th>
                      <th>Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.registros.map((r, i) => (
                      <tr key={`${r.ocurridoEn}-${i}`}>
                        <td>{formatearFechaHora(r.ocurridoEn)}</td>
                        <td>
                          {r.actor ?? <em>sin sesión</em>}
                          {r.rol !== null && <span className="doc-detalle"> · {r.rol}</span>}
                        </td>
                        <td>{r.accion}</td>
                        <td>{r.entidadId ?? r.entidad ?? '—'}</td>
                        <td>
                          <span className={`estado ${r.rechazada ? 'e-rechazada' : 'e-aprobada'}`}>
                            {r.resultado}
                          </span>
                        </td>
                        <td>{r.origen ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {datos.paginas > 1 && (
              <div className="exportar">
                <button
                  type="button"
                  className="boton fantasma pequeno"
                  disabled={datos.pagina <= 1 || cargando}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="boton fantasma pequeno"
                  disabled={datos.pagina >= datos.paginas || cargando}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        )}
      </section>
    </MarcoPrivado>
  );
}
