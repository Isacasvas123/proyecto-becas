/**
 * PÁGINA `/solicitudes/:id` — expediente de una solicitud.
 *
 * Reúne tres historias en una pantalla, porque para el estudiante son un mismo trámite:
 *   - US-013: la lista de documentos exigidos, cada uno con su botón para cargar o reemplazar.
 *   - US-014: el envío, que solo se habilita cuando no falta nada.
 *   - US-016: la línea de tiempo de estados.
 *
 * LA COMPROBACIÓN DEL ARCHIVO EN EL NAVEGADOR ES SOLO CORTESÍA
 *   Se revisan formato y tamaño antes de subir para no hacer esperar a alguien con conexión lenta
 *   por un archivo de 20 MB que será rechazado. Quien decide es el servidor, que además revisa el
 *   CONTENIDO del archivo; su mensaje se muestra tal cual.
 *
 * ENVIAR PIDE CONFIRMACIÓN
 *   Es irreversible: después de enviada, la solicitud ya no se puede modificar (criterio 3). Un
 *   clic accidental no debe cerrar el expediente.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  cargarDocumento,
  descargarDocumento,
  enviarSolicitud,
  obtenerSolicitud,
  type DocumentoDeSolicitud,
  type Solicitud,
} from '../api/cliente';
import { IconoDocumento } from '../componentes/Iconos';
import { MarcoEstudiante } from '../componentes/MarcoEstudiante';
import {
  formatearFecha,
  formatearFechaHora,
  formatearTamano,
  nombreEstadoSolicitud,
} from '../formato';

const TAMANO_MAXIMO = 5 * 1024 * 1024;
const FORMATOS = ['application/pdf', 'image/png', 'image/jpeg'];

function problemaDelArchivo(archivo: File): string | null {
  if (!FORMATOS.includes(archivo.type)) {
    return 'Formato no permitido. Solo se aceptan archivos PDF, JPG o PNG.';
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return `El archivo pesa ${formatearTamano(archivo.size)} y el máximo permitido es 5 MB.`;
  }
  return null;
}

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
  /** Llevar la vista hasta el aviso. No se hace al cargar cada documento: sería un salto por archivo. */
  destacar?: boolean;
}

export function PaginaSolicitud(): ReactElement {
  const { id = '' } = useParams();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const refAviso = useRef<HTMLParagraphElement>(null);

  // En un teléfono el aviso queda a varias pantallas del botón que lo provocó.
  useEffect(() => {
    if (aviso?.tipo === 'error' || aviso?.destacar === true) {
      refAviso.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [aviso]);

  useEffect(() => {
    obtenerSolicitud(id)
      .then(setSolicitud)
      .catch((causa: unknown) =>
        setErrorCarga(causa instanceof Error ? causa.message : 'No se pudo cargar la solicitud.'),
      );
  }, [id]);

  async function subir(documento: DocumentoDeSolicitud, archivo: File): Promise<void> {
    setAviso(null);
    const problema = problemaDelArchivo(archivo);
    if (problema !== null) {
      setAviso({ tipo: 'error', texto: `${documento.descripcion}: ${problema}` });
      return;
    }
    setSubiendo(documento.tipo);
    try {
      setSolicitud(await cargarDocumento(id, documento.tipo, archivo));
      setAviso({
        tipo: 'exito',
        texto: `${documento.descripcion}: ${documento.cargado ? 'reemplazado' : 'cargado'}.`,
      });
    } catch (causa: unknown) {
      setAviso({
        tipo: 'error',
        texto: `${documento.descripcion}: ${causa instanceof Error ? causa.message : 'no se pudo cargar.'}`,
      });
    } finally {
      setSubiendo(null);
    }
  }

  async function ver(documento: DocumentoDeSolicitud): Promise<void> {
    setAviso(null);
    try {
      const archivo = await descargarDocumento(id, documento.tipo);
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = documento.nombreArchivo ?? documento.tipo;
      enlace.click();
      // Se libera después: si se liberara en el acto, algunos navegadores cancelan la descarga.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (causa: unknown) {
      setAviso({
        tipo: 'error',
        texto: causa instanceof Error ? causa.message : 'No se pudo descargar.',
      });
    }
  }

  async function enviar(): Promise<void> {
    setAviso(null);
    setEnviando(true);
    try {
      const enviada = await enviarSolicitud(id);
      setSolicitud(enviada);
      setAviso({
        tipo: 'exito',
        texto: `Solicitud ${enviada.numero} enviada. Le avisaremos cuando cambie de estado.`,
        destacar: true,
      });
    } catch (causa: unknown) {
      // El servidor dice exactamente qué falta (US-014, criterio 2).
      setAviso({
        tipo: 'error',
        texto: causa instanceof Error ? causa.message : 'No se pudo enviar.',
      });
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <MarcoEstudiante>
      <p className="migas">
        <Link to="/solicitudes">← Mis solicitudes</Link>
      </p>

      {errorCarga !== null && (
        <p className="aviso error" role="alert">
          {errorCarga}
        </p>
      )}

      {solicitud === null && errorCarga === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando solicitud" />
      )}

      {solicitud !== null && (
        <>
          <div className="barra-resultados">
            <div>
              <h1>{solicitud.convocatoria.titulo}</h1>
              <p className="conteo">
                Solicitud <strong>{solicitud.numero}</strong> · Convocatoria{' '}
                {solicitud.convocatoria.codigo}
                {solicitud.convocatoria.fechaCierre !== null && (
                  <> · cierra el {formatearFecha(solicitud.convocatoria.fechaCierre)}</>
                )}
              </p>
            </div>
            <span className={`estado grande e-${solicitud.estado.toLowerCase()}`}>
              {nombreEstadoSolicitud(solicitud.estado)}
            </span>
          </div>

          {aviso !== null && (
            <p
              ref={refAviso}
              className={`aviso ${aviso.tipo}`}
              role={aviso.tipo === 'error' ? 'alert' : 'status'}
            >
              {aviso.texto}
            </p>
          )}

          <div className="expediente">
            <section className="panel">
              <h2>Documentos de respaldo</h2>
              <ul className="documentos">
                {solicitud.documentos.map((d) => (
                  <FilaDocumento
                    key={d.tipo}
                    documento={d}
                    editable={solicitud.editable}
                    ocupado={subiendo !== null}
                    subiendo={subiendo === d.tipo}
                    onElegir={(archivo) => void subir(d, archivo)}
                    onVer={() => void ver(d)}
                  />
                ))}
              </ul>
              {solicitud.editable && (
                <p className="nota-panel">
                  PDF, JPG o PNG de hasta 5 MB. Puede reemplazar un archivo mientras la solicitud
                  esté en borrador.
                </p>
              )}
            </section>

            <aside className="lateral">
              {solicitud.editable && (
                <section className="panel envio">
                  <h2>Enviar solicitud</h2>
                  <div className="envio-cuerpo">
                    {solicitud.documentosFaltantes.length > 0 ? (
                      <p>
                        Falta cargar{' '}
                        <strong>
                          {solicitud.documentosFaltantes.length}{' '}
                          {solicitud.documentosFaltantes.length === 1 ? 'documento' : 'documentos'}
                        </strong>
                        .
                      </p>
                    ) : (
                      <p>Todos los documentos están cargados.</p>
                    )}
                    <p className="pista">
                      Al enviarla ya no podrá modificarla. Revise que cada archivo sea el correcto.
                    </p>
                    {!confirmando ? (
                      <button
                        type="button"
                        className="boton ancho"
                        disabled={solicitud.documentosFaltantes.length > 0 || subiendo !== null}
                        onClick={() => setConfirmando(true)}
                      >
                        Enviar solicitud
                      </button>
                    ) : (
                      <div className="confirmar">
                        <p>
                          <strong>¿Enviar ahora?</strong> Esta acción no se puede deshacer.
                        </p>
                        <button
                          type="button"
                          className="boton ancho"
                          disabled={enviando}
                          onClick={() => void enviar()}
                        >
                          {enviando ? 'Enviando…' : 'Sí, enviar'}
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
                    <p className="pista">
                      ¿Faltan datos del perfil? <Link to="/perfil">Revise su perfil</Link>.
                    </p>
                  </div>
                </section>
              )}

              <section className="panel">
                <h2>Historial</h2>
                <ol className="linea-tiempo">
                  {[...solicitud.historial].reverse().map((h) => (
                    <li key={`${h.hacia}-${h.ocurridoEn}`}>
                      <span className={`estado e-${h.hacia.toLowerCase()}`}>
                        {nombreEstadoSolicitud(h.hacia)}
                      </span>
                      <time dateTime={h.ocurridoEn}>{formatearFechaHora(h.ocurridoEn)}</time>
                      {h.desde === null && <span className="detalle">Solicitud iniciada</span>}
                      {h.motivo !== null && <span className="detalle">{h.motivo}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            </aside>
          </div>
        </>
      )}
    </MarcoEstudiante>
  );
}

interface PropsFila {
  documento: DocumentoDeSolicitud;
  editable: boolean;
  ocupado: boolean;
  subiendo: boolean;
  onElegir: (archivo: File) => void;
  onVer: () => void;
}

function FilaDocumento({
  documento,
  editable,
  ocupado,
  subiendo,
  onElegir,
  onVer,
}: PropsFila): ReactElement {
  const entrada = useRef<HTMLInputElement>(null);
  const idEntrada = `archivo-${documento.tipo}`;

  return (
    <li className={documento.cargado ? 'cargado' : 'pendiente'}>
      <span className="marca-doc" aria-hidden="true">
        {documento.cargado ? '✓' : <IconoDocumento />}
      </span>
      <div className="doc-texto">
        <span className="doc-nombre">{documento.descripcion}</span>
        {documento.cargado ? (
          <span className="doc-detalle">
            <button type="button" className="enlace" onClick={onVer}>
              {documento.nombreArchivo}
            </button>
            {documento.tamanoBytes !== null && <> · {formatearTamano(documento.tamanoBytes)}</>}
            {documento.cargadoEn !== null && <> · {formatearFechaHora(documento.cargadoEn)}</>}
          </span>
        ) : (
          <span className="doc-detalle">Pendiente</span>
        )}
      </div>
      {editable && (
        <>
          <input
            ref={entrada}
            id={idEntrada}
            type="file"
            className="solo-lector"
            accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
            disabled={ocupado}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              // Se limpia para que elegir el mismo archivo otra vez vuelva a disparar el cambio.
              e.target.value = '';
              if (archivo !== undefined) onElegir(archivo);
            }}
          />
          <button
            type="button"
            className={`boton pequeno ${documento.cargado ? 'fantasma' : ''}`}
            disabled={ocupado}
            aria-label={`${documento.cargado ? 'Reemplazar' : 'Cargar'} ${documento.descripcion}`}
            onClick={() => entrada.current?.click()}
          >
            {subiendo ? 'Subiendo…' : documento.cargado ? 'Reemplazar' : 'Cargar'}
          </button>
        </>
      )}
    </li>
  );
}
