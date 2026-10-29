/**
 * Página `/consulta`: consulta pública del estado de una solicitud, sin cuenta (US-025). Muestra
 * lo que devuelve el servidor, estado y fecha del último cambio; si los datos no coinciden, el
 * mensaje es el genérico, que no dice cuál de los dos estaba mal.
 *
 * El NFR de usabilidad pide consultar el estado en máximo 3 clics desde la página principal; aquí
 * son dos: "Consultar estado" en el encabezado y "Consultar".
 */
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { consultarEstadoPublico, type EstadoPublico } from '../api/cliente';
import { Encabezado } from '../componentes/Encabezado';
import { formatearFechaHora, nombreEstadoSolicitud } from '../formato';
import { useSesion } from '../sesion/ContextoSesion';

/** Qué significa cada estado, en palabras de quien espera una beca. */
const EXPLICACION: Record<string, string> = {
  BORRADOR: 'La solicitud todavía no se ha enviado.',
  ENVIADA: 'La solicitud se recibió y espera que se le asigne un comité evaluador.',
  EN_EVALUACION: 'Un comité está revisando la solicitud.',
  APROBADA: 'La solicitud fue aprobada. Falta la adjudicación formal de la beca.',
  RECHAZADA: 'La solicitud no fue aprobada. El motivo se puede ver desde la cuenta del estudiante.',
  ADJUDICADA: 'La beca fue adjudicada.',
};

export function PaginaConsulta(): ReactElement {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();
  const [numero, setNumero] = useState('');
  const [cui, setCui] = useState('');
  const [resultado, setResultado] = useState<EstadoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const respuesta = useRef<HTMLDivElement>(null);

  // En un teléfono la respuesta queda debajo del teclado y del formulario.
  useEffect(() => {
    if (resultado !== null || error !== null) {
      respuesta.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [resultado, error]);

  async function consultar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setResultado(null);
    setConsultando(true);
    try {
      setResultado(await consultarEstadoPublico(numero, cui));
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo consultar.');
    } finally {
      setConsultando(false);
    }
  }

  return (
    <>
      <Encabezado
        sesion={sesion}
        onCerrarSesion={() => {
          cerrar();
          navegar('/consulta', { replace: true });
        }}
      />
      <div className="contenido">
        <main className="privada consulta">
          <div className="barra-resultados">
            <div>
              <h1>Consultar el estado de una solicitud</h1>
              <p className="conteo">
                Sin cuenta. Necesita el número de solicitud y el CUI de quien la presentó.
              </p>
            </div>
          </div>

          <form className="panel formulario-perfil" onSubmit={(e) => void consultar(e)}>
            <div className="rejilla">
              <div className="campo">
                <label htmlFor="consulta-numero">Número de solicitud</label>
                <input
                  id="consulta-numero"
                  required
                  maxLength={20}
                  autoComplete="off"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="SOL-2026-000123"
                />
              </div>
              <div className="campo">
                <label htmlFor="consulta-cui">CUI del solicitante</label>
                <input
                  id="consulta-cui"
                  required
                  maxLength={20}
                  inputMode="numeric"
                  autoComplete="off"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  placeholder="13 dígitos, como aparece en el DPI"
                />
              </div>
            </div>
            <div className="acciones">
              <button type="submit" className="boton" disabled={consultando}>
                {consultando ? 'Consultando…' : 'Consultar'}
              </button>
            </div>
          </form>

          <div ref={respuesta} className="respuesta-consulta">
            {error !== null && (
              <p className="aviso error" role="alert">
                {error}
              </p>
            )}

            {resultado !== null && (
              <section className="panel resultado-consulta" aria-live="polite">
                <h2>Solicitud {resultado.numero}</h2>
                <div className="envio-cuerpo">
                  <p>
                    <span className={`estado grande e-${resultado.estado.toLowerCase()}`}>
                      {nombreEstadoSolicitud(resultado.estado)}
                    </span>
                  </p>
                  <p>{EXPLICACION[resultado.estado] ?? ''}</p>
                  <p className="pista">
                    Último cambio: {formatearFechaHora(resultado.ultimoCambio)}
                  </p>
                </div>
              </section>
            )}
          </div>

          <p className="nota-consulta">
            Por privacidad, aquí no se muestran nombres, documentos ni puntajes. Si los datos no
            coinciden, el sistema no dice cuál de los dos está mal.
          </p>
        </main>
      </div>
    </>
  );
}
