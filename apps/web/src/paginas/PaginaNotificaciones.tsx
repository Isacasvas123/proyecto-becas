/**
 * Página `/notificaciones`: la bandeja del estudiante (US-022), pedida por el Product Owner el 17
 * de octubre: cuando una solicitud cambie de estado, el sistema debe registrar el evento y
 * generar una notificación.
 *
 * El evento queda en el historial de la solicitud y esta pantalla es el aviso, que el backend
 * genera con el patrón Observer sin que ningún caso de uso lo pida. Cada quien ve solo las suyas:
 * el servidor filtra por el token y nunca por un id de la URL.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  marcarNotificacionLeida,
  marcarTodasLeidas,
  obtenerNotificaciones,
  type BandejaNotificaciones,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { formatearFechaHora, nombreEstadoSolicitud } from '../formato';

export function PaginaNotificaciones(): ReactElement {
  const [bandeja, setBandeja] = useState<BandejaNotificaciones | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setBandeja(await obtenerNotificaciones());
      setError(null);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudieron cargar sus avisos.');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const marcarUna = async (id: string) => {
    setOcupado(true);
    try {
      await marcarNotificacionLeida(id);
      await cargar();
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo marcar.');
    } finally {
      setOcupado(false);
    }
  };

  const marcarTodas = async () => {
    setOcupado(true);
    try {
      await marcarTodasLeidas();
      await cargar();
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo marcar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <MarcoPrivado>
      <section className="contenido">
        <header className="encabezado-pagina">
          <h1>Mis avisos</h1>
          <p className="descripcion">
            Cada vez que una de sus solicitudes cambia de estado, queda registrado aquí.
          </p>
        </header>

        {error !== null && (
          <p className="aviso error" role="alert">
            {error}
          </p>
        )}

        {bandeja !== null && (
          <section className="panel">
            <div className="encabezado-reporte">
              <p>
                {bandeja.sinLeer === 0
                  ? 'No tiene avisos sin leer.'
                  : `${bandeja.sinLeer} ${bandeja.sinLeer === 1 ? 'aviso nuevo' : 'avisos nuevos'}.`}
              </p>
              {bandeja.sinLeer > 0 && (
                <button
                  type="button"
                  className="boton pequeno fantasma"
                  disabled={ocupado}
                  onClick={() => void marcarTodas()}
                >
                  Marcar todos como leídos
                </button>
              )}
            </div>

            {bandeja.notificaciones.length === 0 ? (
              <p className="nota-panel">
                Todavía no tiene avisos. Aparecerán cuando postule y su solicitud avance.
              </p>
            ) : (
              <ul className="documentos">
                {bandeja.notificaciones.map((n) => (
                  <li key={n.id}>
                    <div className="doc-texto">
                      <span className="doc-nombre">
                        {!n.leida && <strong aria-label="Sin leer">· </strong>}
                        {n.mensaje}
                      </span>
                      <span className="doc-detalle">
                        <span className={`estado e-${n.estado.toLowerCase()}`}>
                          {nombreEstadoSolicitud(n.estado)}
                        </span>{' '}
                        · {formatearFechaHora(n.creadaEn)}
                        {n.motivo !== null && ` · Motivo: ${n.motivo}`}
                      </span>
                    </div>
                    <div className="exportar">
                      <Link className="boton pequeno fantasma" to={`/solicitudes/${n.solicitudId}`}>
                        Ver solicitud
                      </Link>
                      {!n.leida && (
                        <button
                          type="button"
                          className="boton pequeno fantasma"
                          disabled={ocupado}
                          onClick={() => void marcarUna(n.id)}
                        >
                          Marcar leído
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </section>
    </MarcoPrivado>
  );
}
