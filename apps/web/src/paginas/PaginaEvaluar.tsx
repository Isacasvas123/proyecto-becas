/**
 * PÁGINA `/evaluaciones/:id` — evaluar una solicitud (US-019, CU-10).
 *
 * El puntaje NO se escribe: lo calcula el servidor con el criterio del tipo de beca y aquí se
 * muestra con su desglose, para que el evaluador sepa de dónde sale antes de firmar. Lo que el
 * evaluador aporta es su recomendación y la observación que la justifica.
 *
 * EMITIR PIDE CONFIRMACIÓN: un dictamen no se puede modificar (criterio 4).
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  descargarDocumentoEvaluacion,
  emitirDictamen,
  obtenerExpedienteEvaluacion,
  type ExpedienteEvaluacion,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { VisorDocumento } from '../componentes/VisorDocumento';
import {
  formatearFechaHora,
  formatearTamano,
  nombreDepartamento,
  nombreEstadoSolicitud,
} from '../formato';

const MINIMO_OBSERVACION = 20;

interface DocumentoAbierto {
  tipo: string;
  nombre: string;
  descripcion: string;
  archivo: Blob;
}

const NIVEL: Record<string, string> = {
  NIVEL_MEDIO: 'Nivel medio',
  UNIVERSITARIO: 'Universitario',
  POSGRADO: 'Posgrado',
};

const quetzales = (n: number | null) =>
  n === null ? '—' : `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 0 })}`;

export function PaginaEvaluar(): ReactElement {
  const { id = '' } = useParams();
  const [expediente, setExpediente] = useState<ExpedienteEvaluacion | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [recomendacion, setRecomendacion] = useState<'FAVORABLE' | 'DESFAVORABLE' | ''>('');
  const [observacion, setObservacion] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<DocumentoAbierto | null>(null);
  const [abriendo, setAbriendo] = useState<string | null>(null);

  useEffect(() => {
    obtenerExpedienteEvaluacion(id)
      .then(setExpediente)
      .catch((causa: unknown) =>
        setErrorCarga(causa instanceof Error ? causa.message : 'No se pudo cargar la solicitud.'),
      );
  }, [id]);

  const largo = observacion.trim().length;
  const listo = recomendacion !== '' && largo >= MINIMO_OBSERVACION;

  function pedirConfirmacion(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (listo) setConfirmando(true);
  }

  async function emitir(): Promise<void> {
    if (recomendacion === '') return;
    setError(null);
    setEnviando(true);
    try {
      const dictamen = await emitirDictamen(id, { recomendacion, observacion });
      setExpediente((e) => (e === null ? e : { ...e, dictamen, puedeDictaminar: false }));
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo emitir el dictamen.');
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  async function abrir(tipo: string, nombre: string, descripcion: string): Promise<void> {
    if (abierto?.tipo === tipo) {
      setAbierto(null);
      return;
    }
    setError(null);
    setAbriendo(tipo);
    try {
      setAbierto({
        tipo,
        nombre,
        descripcion,
        archivo: await descargarDocumentoEvaluacion(id, tipo),
      });
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo abrir el documento.');
    } finally {
      setAbriendo(null);
    }
  }

  return (
    <MarcoPrivado>
      <p className="migas">
        <Link to="/evaluaciones">← Mis evaluaciones</Link>
      </p>

      {errorCarga !== null && (
        <p className="aviso error" role="alert">
          {errorCarga}
        </p>
      )}

      {expediente === null && errorCarga === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando solicitud" />
      )}

      {expediente !== null && (
        <>
          <div className="barra-resultados">
            <div>
              <h1>{expediente.solicitante.nombreCompleto}</h1>
              <p className="conteo">
                Solicitud <strong>{expediente.numero}</strong> · {expediente.convocatoria}
              </p>
            </div>
            <span className={`estado grande e-${expediente.estado.toLowerCase()}`}>
              {nombreEstadoSolicitud(expediente.estado)}
            </span>
          </div>

          <div className="expediente">
            <div className="lateral">
              <section className="panel">
                <h2>Datos del solicitante</h2>
                <dl className="ficha">
                  <dt>Centro educativo</dt>
                  <dd>{expediente.solicitante.centroEducativo ?? '—'}</dd>
                  <dt>Nivel</dt>
                  <dd>{NIVEL[expediente.solicitante.nivel ?? ''] ?? '—'}</dd>
                  <dt>Promedio</dt>
                  <dd>{expediente.solicitante.promedio ?? '—'}</dd>
                  <dt>Ingreso familiar mensual</dt>
                  <dd>{quetzales(expediente.solicitante.ingresoFamiliarMensual)}</dd>
                  <dt>Dependientes de ese ingreso</dt>
                  <dd>{expediente.solicitante.dependientes ?? '—'}</dd>
                  <dt>Residencia</dt>
                  <dd>
                    {[
                      expediente.solicitante.municipio,
                      nombreDepartamento(expediente.solicitante.departamento),
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </dd>
                </dl>
              </section>

              <section className="panel">
                <h2>Documentos</h2>
                <ul className="documentos">
                  {expediente.documentos.map((d) => (
                    <li
                      key={d.tipo}
                      className={[
                        d.cargado ? 'cargado' : 'pendiente',
                        abierto?.tipo === d.tipo ? 'abierto' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="marca-doc" aria-hidden="true">
                        {d.cargado ? '✓' : '—'}
                      </span>
                      <div className="doc-texto">
                        <span className="doc-nombre">{d.descripcion}</span>
                        {d.cargado && d.nombreArchivo !== null ? (
                          <span className="doc-detalle">
                            <button
                              type="button"
                              className="enlace"
                              aria-expanded={abierto?.tipo === d.tipo}
                              onClick={() =>
                                void abrir(d.tipo, d.nombreArchivo ?? d.tipo, d.descripcion)
                              }
                            >
                              {abriendo === d.tipo
                                ? 'Abriendo…'
                                : abierto?.tipo === d.tipo
                                  ? 'Ocultar'
                                  : 'Ver'}
                            </button>
                            {' · '}
                            {d.nombreArchivo}
                            {d.tamanoBytes !== null && <> · {formatearTamano(d.tamanoBytes)}</>}
                          </span>
                        ) : (
                          <span className="doc-detalle">No cargado</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {abierto !== null && (
                <VisorDocumento
                  nombre={abierto.nombre}
                  descripcion={abierto.descripcion}
                  archivo={abierto.archivo}
                  onCerrar={() => setAbierto(null)}
                />
              )}
            </div>

            <div className="lateral">
              <section className="panel">
                <h2>Puntaje</h2>
                {expediente.dictamen !== null ? (
                  <Calculo
                    criterio={expediente.dictamen.criterio}
                    puntaje={expediente.dictamen.puntaje}
                    desglose={expediente.dictamen.desglose}
                  />
                ) : expediente.calculo !== null ? (
                  <Calculo {...expediente.calculo} />
                ) : (
                  <p className="nota-panel">No se puede calcular: {expediente.problemaCalculo}</p>
                )}
              </section>

              {expediente.dictamen !== null && (
                <section className="panel">
                  <h2>Su dictamen</h2>
                  <div className="envio-cuerpo">
                    <p>
                      <span
                        className={`estado ${expediente.dictamen.recomendacion === 'FAVORABLE' ? 'e-aprobada' : 'e-rechazada'}`}
                      >
                        {expediente.dictamen.recomendacion === 'FAVORABLE'
                          ? 'Favorable'
                          : 'Desfavorable'}
                      </span>
                    </p>
                    <p className="observacion">{expediente.dictamen.observacion}</p>
                    <p className="pista">
                      Emitido el {formatearFechaHora(expediente.dictamen.emitidoEn)}. Un dictamen no
                      se modifica.
                    </p>
                  </div>
                </section>
              )}

              {expediente.dictamen === null && !expediente.puedeDictaminar && (
                <p className="aviso">
                  {expediente.estado !== 'EN_EVALUACION'
                    ? 'Esta solicitud ya no está en evaluación.'
                    : 'Falta un dato del perfil del solicitante para calcular el puntaje.'}
                </p>
              )}

              {expediente.puedeDictaminar && (
                <form className="panel" onSubmit={pedirConfirmacion}>
                  <h2>Emitir dictamen</h2>
                  <div className="envio-cuerpo">
                    <fieldset className="opciones">
                      <legend>Recomendación</legend>
                      <label>
                        <input
                          type="radio"
                          name="recomendacion"
                          checked={recomendacion === 'FAVORABLE'}
                          onChange={() => setRecomendacion('FAVORABLE')}
                        />
                        Favorable
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="recomendacion"
                          checked={recomendacion === 'DESFAVORABLE'}
                          onChange={() => setRecomendacion('DESFAVORABLE')}
                        />
                        Desfavorable
                      </label>
                    </fieldset>
                    <div className="campo">
                      <label htmlFor="observacion">Observación</label>
                      <textarea
                        id="observacion"
                        rows={5}
                        maxLength={2000}
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Justifique su recomendación con lo que revisó."
                      />
                      <span
                        className={`pista ${largo > 0 && largo < MINIMO_OBSERVACION ? 'alerta' : ''}`}
                      >
                        {largo < MINIMO_OBSERVACION
                          ? `Mínimo ${MINIMO_OBSERVACION} caracteres (lleva ${largo}).`
                          : `${largo} caracteres.`}
                      </span>
                    </div>

                    {error !== null && (
                      <p className="aviso error" role="alert">
                        {error}
                      </p>
                    )}

                    {!confirmando ? (
                      <button type="submit" className="boton ancho" disabled={!listo}>
                        Emitir dictamen
                      </button>
                    ) : (
                      <div className="confirmar">
                        <p>
                          <strong>¿Emitir ahora?</strong> Después no se podrá modificar.
                        </p>
                        <button
                          type="button"
                          className="boton ancho"
                          disabled={enviando}
                          onClick={() => void emitir()}
                        >
                          {enviando ? 'Emitiendo…' : 'Sí, emitir'}
                        </button>
                        <button
                          type="button"
                          className="boton fantasma ancho"
                          disabled={enviando}
                          onClick={() => setConfirmando(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </MarcoPrivado>
  );
}

function Calculo({
  criterio,
  puntaje,
  desglose,
}: {
  criterio: string;
  puntaje: number;
  desglose: { concepto: string; valor: string; aporte: number }[];
}): ReactElement {
  return (
    <div className="envio-cuerpo">
      <p className="puntaje-grande">
        {puntaje.toFixed(2)} <span>/ 100</span>
      </p>
      <p className="pista">{criterio}</p>
      <ul className="desglose">
        {desglose.map((l) => (
          <li key={l.concepto}>
            <span>
              <b>{l.concepto}</b>
              <span className="pista">{l.valor}</span>
            </span>
            <span className="aporte">+{l.aporte.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
