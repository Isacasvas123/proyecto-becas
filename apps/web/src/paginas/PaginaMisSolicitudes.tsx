/**
 * PÁGINA `/solicitudes` — mis solicitudes (US-015).
 *
 * Es el panel del estudiante: a donde llega al iniciar sesión. Cada fila dice en qué estado está
 * su trámite y, si sigue en borrador, cuánto le falta para poder enviarlo: es la pregunta que se
 * hace la persona cada vez que entra.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { listarMisSolicitudes, type Solicitud } from '../api/cliente';
import { MarcoEstudiante } from '../componentes/MarcoEstudiante';
import { formatearFecha, formatearFechaHora, nombreEstadoSolicitud } from '../formato';

function situacion(s: Solicitud): string {
  if (!s.editable) {
    return s.enviadaEn !== null ? `Enviada el ${formatearFechaHora(s.enviadaEn)}` : '';
  }
  const total = s.documentos.length;
  const faltan = s.documentosFaltantes.length;
  return faltan === 0
    ? 'Documentos completos: lista para enviar'
    : `${total - faltan} de ${total} documentos cargados`;
}

export function PaginaMisSolicitudes(): ReactElement {
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarMisSolicitudes()
      .then(setSolicitudes)
      .catch((causa: unknown) =>
        setError(causa instanceof Error ? causa.message : 'No se pudieron cargar.'),
      );
  }, []);

  return (
    <MarcoEstudiante>
      <div className="barra-resultados">
        <div>
          <h1>Mis solicitudes</h1>
          {solicitudes !== null && (
            <p className="conteo">
              <strong>{solicitudes.length}</strong>{' '}
              {solicitudes.length === 1 ? 'solicitud' : 'solicitudes'}
            </p>
          )}
        </div>
        <Link to="/convocatorias" className="boton">
          Buscar convocatorias
        </Link>
      </div>

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      {solicitudes === null && error === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando solicitudes" />
      )}

      {solicitudes !== null && solicitudes.length === 0 && (
        <p className="aviso">
          Todavía no ha postulado a ninguna beca. Revise las{' '}
          <Link to="/convocatorias">convocatorias vigentes</Link> y use el botón «Postular».
        </p>
      )}

      {solicitudes !== null && solicitudes.length > 0 && (
        <ul className="lista">
          {solicitudes.map((s) => (
            <li key={s.id} className="solicitud-fila">
              <div>
                <div className="cabecera">
                  <h3>
                    <Link to={`/solicitudes/${s.id}`}>{s.convocatoria.titulo}</Link>
                  </h3>
                  <span className={`estado e-${s.estado.toLowerCase()}`}>
                    {nombreEstadoSolicitud(s.estado)}
                  </span>
                </div>
                <div className="meta">
                  <span className="item">
                    <b>{s.numero}</b>
                  </span>
                  <span className="item">Iniciada el {formatearFecha(s.creadaEn)}</span>
                  <span className="item">{situacion(s)}</span>
                </div>
              </div>
              <Link to={`/solicitudes/${s.id}`} className="boton fantasma pequeno">
                {s.editable ? 'Continuar' : 'Ver detalle'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MarcoEstudiante>
  );
}
