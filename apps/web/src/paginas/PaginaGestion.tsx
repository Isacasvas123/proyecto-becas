/**
 * Página `/gestion`: administración de convocatorias (US-006, US-007), solo ADMINISTRADOR. Como
 * en toda pantalla protegida, la guardia del frontend es usabilidad y la seguridad la pone el
 * `RolesGuard` del backend: si alguien fuerza la página, cada petición recibe 403.
 *
 * Es una tabla y no tarjetas: el público compara convocatorias, el administrador las opera
 * (revisar estados, publicar), y para eso una tabla densa con una acción por fila es más rápida.
 *
 * Permite crear en borrador y publicar. Editar un borrador (US-010) y cerrar (US-009) no existen,
 * y no se muestran botones que no llevan a ningún lado.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  listarConvocatoriasGestion,
  publicarConvocatoria,
  type Convocatoria,
} from '../api/cliente';
import { Encabezado } from '../componentes/Encabezado';
import { FormularioConvocatoria } from '../componentes/FormularioConvocatoria';
import { claseTipo, formatearFecha, formatearQuetzales, nombreTipo } from '../formato';

/** El mismo umbral del backend. Solo decide qué se marca en la tabla, no ninguna regla. */
const UMBRAL_SEGUNDA_APROBACION = 10_000;
import { useSesion } from '../sesion/ContextoSesion';

const NOMBRE_ESTADO: Record<string, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  CERRADA: 'Cerrada',
};

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
  /**
   * A dónde ir después, cuando la acción deja un siguiente paso obvio.
   *
   * Un «creada en borrador» a secas deja al administrador en la misma pantalla sin saber que
   * la convocatoria todavía no la ve nadie. El aviso que lleva al paso siguiente convierte una
   * confirmación en una instrucción.
   */
  enlace?: { a: string; texto: string };
}

export function PaginaGestion(): ReactElement {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();

  const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [publicando, setPublicando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const cargar = useCallback(async () => {
    try {
      setConvocatorias(await listarConvocatoriasGestion());
      setErrorCarga(null);
    } catch (causa: unknown) {
      setErrorCarga(causa instanceof Error ? causa.message : 'No se pudieron cargar.');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function publicar(convocatoria: Convocatoria): Promise<void> {
    setAviso(null);
    setPublicando(convocatoria.id);
    try {
      const publicada = await publicarConvocatoria(convocatoria.id);
      // Se reemplaza solo la fila publicada en vez de recargar todo: la tabla no parpadea y
      // el administrador no pierde la posición de lectura.
      setConvocatorias((lista) =>
        (lista ?? []).map((c) => (c.id === publicada.id ? publicada : c)),
      );
      setAviso({
        tipo: 'exito',
        texto: `${publicada.codigo} publicada.`,
        enlace: { a: '/convocatorias', texto: 'Verla en el listado público' },
      });
    } catch (causa: unknown) {
      // El mensaje viene del dominio: dice exactamente qué falta (p. ej. "sin al menos un
      // requisito definido") en lugar de un genérico que obligue a adivinar.
      setAviso({
        tipo: 'error',
        texto: causa instanceof Error ? causa.message : 'No se pudo publicar.',
      });
    } finally {
      setPublicando(null);
    }
  }

  function alCrear(creada: Convocatoria): void {
    setCreando(false);
    setConvocatorias((lista) => [creada, ...(lista ?? [])]);
    setAviso({
      tipo: 'exito',
      texto: `${creada.codigo} creada en borrador. Todavía no la ve ningún estudiante: publíquela cuando esté lista.`,
    });
  }

  function cerrarSesion(): void {
    cerrar();
    navegar('/convocatorias', { replace: true });
  }

  const borradores = convocatorias?.filter((c) => c.estado === 'BORRADOR').length ?? 0;

  return (
    <>
      <Encabezado sesion={sesion} onCerrarSesion={cerrarSesion} />

      <div className="contenido">
        <main className="gestion">
          <div className="barra-resultados">
            <div>
              <h1>Gestión de convocatorias</h1>
              {convocatorias !== null && (
                <p className="conteo">
                  <strong>{convocatorias.length}</strong> en total · <strong>{borradores}</strong>{' '}
                  en borrador
                </p>
              )}
            </div>
            {!creando && (
              <button type="button" className="boton" onClick={() => setCreando(true)}>
                Nueva convocatoria
              </button>
            )}
          </div>

          {aviso !== null && (
            <p className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
              {aviso.texto}{' '}
              {aviso.enlace !== undefined && <Link to={aviso.enlace.a}>{aviso.enlace.texto}</Link>}
            </p>
          )}

          {creando && (
            <section className="panel">
              <FormularioConvocatoria onCreada={alCrear} onCancelar={() => setCreando(false)} />
            </section>
          )}

          {errorCarga !== null && (
            <p className="aviso error" role="alert">
              {errorCarga}
            </p>
          )}

          {convocatorias === null && errorCarga === null && (
            <div className="esqueleto alto" aria-busy="true" aria-label="Cargando convocatorias" />
          )}

          {convocatorias !== null && convocatorias.length === 0 && (
            <p className="aviso">Todavía no hay convocatorias. Cree la primera.</p>
          )}

          {convocatorias !== null && convocatorias.length > 0 && (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Convocatoria</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="num">
                      Cupos
                    </th>
                    <th scope="col" className="num">
                      Monto
                    </th>
                    <th scope="col">Cierra</th>
                    <th scope="col">
                      <span className="solo-lector">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {convocatorias.map((c) => (
                    <tr key={c.id}>
                      <td className="codigo">{c.codigo}</td>
                      <td>
                        <div className="titulo-fila">{c.titulo}</div>
                        <span className={`etiqueta-tipo ${claseTipo(c.tipo)}`}>
                          {nombreTipo(c.tipo)}
                        </span>
                      </td>
                      <td>
                        <span className={`estado e-${c.estado.toLowerCase()}`}>
                          {NOMBRE_ESTADO[c.estado] ?? c.estado}
                        </span>
                      </td>
                      <td className="num">{c.cupos.toLocaleString('es-GT')}</td>
                      {/* El monto decide si cada resolución necesitará una firma o dos. Sin esta
                          columna, el administrador tiene que abrir la convocatoria para saberlo. */}
                      <td className="num">
                        {c.montoBeca > 0 ? (
                          formatearQuetzales(c.montoBeca)
                        ) : (
                          <span className="pista">—</span>
                        )}
                        {c.montoBeca > UMBRAL_SEGUNDA_APROBACION && (
                          <div
                            className="marca-doble-firma"
                            title="Supera Q10,000.00: cada resolución necesita una segunda aprobación de otra persona."
                          >
                            doble firma
                          </div>
                        )}
                      </td>
                      <td>{formatearFecha(c.fechaCierre)}</td>
                      <td className="accion">
                        {c.estado === 'BORRADOR' && (
                          <button
                            type="button"
                            className="boton pequeno"
                            disabled={publicando !== null}
                            onClick={() => void publicar(c)}
                          >
                            {publicando === c.id ? 'Publicando…' : 'Publicar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
