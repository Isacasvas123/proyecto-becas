/**
 * PÁGINA `/evaluaciones` — mis solicitudes asignadas (US-020). Es el panel del evaluador.
 *
 * Solo aparecen las que le asignaron (lo garantiza el servidor), primero las pendientes.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { listarAsignadas, type SolicitudAsignada } from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { formatearFecha, nombreEstadoSolicitud } from '../formato';

export function PaginaEvaluaciones(): ReactElement {
  const [asignadas, setAsignadas] = useState<SolicitudAsignada[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarAsignadas()
      .then(setAsignadas)
      .catch((causa: unknown) =>
        setError(causa instanceof Error ? causa.message : 'No se pudieron cargar.'),
      );
  }, []);

  const pendientes = asignadas?.filter((a) => !a.dictaminada).length ?? 0;

  return (
    <MarcoPrivado>
      <div className="barra-resultados">
        <div>
          <h1>Mis evaluaciones</h1>
          {asignadas !== null && (
            <p className="conteo">
              <strong>{pendientes}</strong> pendientes de {asignadas.length} asignadas
            </p>
          )}
        </div>
      </div>

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      {asignadas === null && error === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando asignadas" />
      )}

      {asignadas !== null && asignadas.length === 0 && (
        <p className="aviso">
          Todavía no tiene solicitudes asignadas. Aparecerán aquí cuando el administrador las
          reparta.
        </p>
      )}

      {asignadas !== null && asignadas.length > 0 && (
        <ul className="lista">
          {asignadas.map((a) => (
            <li key={a.solicitudId} className="solicitud-fila">
              <div>
                <div className="cabecera">
                  <h3>
                    <Link to={`/evaluaciones/${a.solicitudId}`}>{a.numero}</Link>
                  </h3>
                  {a.dictaminada ? (
                    <span
                      className={`estado ${a.recomendacion === 'FAVORABLE' ? 'e-aprobada' : 'e-rechazada'}`}
                    >
                      {a.recomendacion === 'FAVORABLE' ? 'Favorable' : 'Desfavorable'} ·{' '}
                      {a.puntaje?.toFixed(2)}
                    </span>
                  ) : (
                    <span className="estado e-en_evaluacion">Por dictaminar</span>
                  )}
                </div>
                <div className="meta">
                  <span className="item">{a.convocatoria}</span>
                  <span className="item">Asignada el {formatearFecha(a.asignadaEn)}</span>
                  <span className="item">
                    Solicitud {nombreEstadoSolicitud(a.estado).toLowerCase()}
                  </span>
                </div>
              </div>
              <Link
                to={`/evaluaciones/${a.solicitudId}`}
                className={`boton pequeno ${a.dictaminada ? 'fantasma' : ''}`}
              >
                {a.dictaminada ? 'Ver dictamen' : 'Evaluar'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MarcoPrivado>
  );
}
