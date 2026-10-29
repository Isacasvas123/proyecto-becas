/**
 * Página `/convocatorias`: listado de convocatorias de beca.
 *
 * Es una banda de cifras, un panel de facetas y una lista de tarjetas, el patrón de una bolsa de
 * empleo (computrabajo, tecoloco) y no el de una página de presentación, porque la tarea real del
 * usuario es comparar convocatorias y decidir a cuál postular.
 *
 * Es pública (US-008): la historia pide que un visitante las vea sin cuenta, la necesidad de Ana
 * (docs/03-vision-producto.md) y un requisito de transparencia del enunciado. La gestión vive en
 * `/gestion`.
 *
 * Un estudiante ve «Postular» en cada tarjeta (US-012) y un visitante, una invitación a iniciar
 * sesión. Si el servidor rechaza la postulación porque falta el perfil, el aviso lleva a
 * completarlo y de vuelta. El filtro es local, sobre lo ya descargado.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  crearSolicitud,
  listarConvocatorias,
  listarCuposPublicos,
  type Convocatoria,
} from '../api/cliente';
import { BandaEstadisticas } from '../componentes/BandaEstadisticas';
import { Encabezado } from '../componentes/Encabezado';
import { PanelFiltros } from '../componentes/PanelFiltros';
import { TarjetaConvocatoria } from '../componentes/TarjetaConvocatoria';
import { estadoPlazo, formatearFecha, nombreTipo } from '../formato';
import { useSesion } from '../sesion/ContextoSesion';

interface Consulta<T> {
  datos: T | null;
  error: string | null;
  cargando: boolean;
}

export function PaginaConvocatorias(): ReactElement {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();

  const [consulta, setConsulta] = useState<Consulta<Convocatoria[]>>({
    datos: null,
    error: null,
    cargando: true,
  });
  const [tipoActivo, setTipoActivo] = useState<string | null>(null);
  const [postulando, setPostulando] = useState<string | null>(null);
  const [errorPostulacion, setErrorPostulacion] = useState<string | null>(null);
  // Cupos que quedan por convocatoria. Vacío mientras no lleguen, o si la petición falla:
  // la tarjeta sabe prescindir del dato.
  const [disponibles, setDisponibles] = useState<Map<string, number>>(new Map());
  const esEstudiante = sesion?.usuario.rol === 'ESTUDIANTE';
  const avisoPostulacion = useRef<HTMLParagraphElement>(null);

  // El botón está en la tarjeta y el aviso arriba de la lista: en un teléfono quedarían a varias
  // pantallas de distancia y la persona creería que no pasó nada.
  useEffect(() => {
    if (errorPostulacion !== null) {
      avisoPostulacion.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorPostulacion]);

  useEffect(() => {
    let cancelado = false;

    Promise.all([listarConvocatorias(), listarCuposPublicos().catch(() => [])])
      .then(([datos, cupos]) => {
        if (cancelado) return;
        setDisponibles(new Map(cupos.map((c) => [c.convocatoriaId, c.disponibles])));
        setConsulta({ datos, error: null, cargando: false });
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setConsulta({
            datos: null,
            cargando: false,
            error:
              causa instanceof Error
                ? causa.message
                : 'No se pudo contactar con el servicio de convocatorias.',
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const todas = useMemo(() => consulta.datos ?? [], [consulta.datos]);
  const visibles = useMemo(
    () => (tipoActivo === null ? todas : todas.filter((c) => c.tipo === tipoActivo)),
    [todas, tipoActivo],
  );

  async function postular(convocatoria: Convocatoria): Promise<void> {
    setErrorPostulacion(null);
    setPostulando(convocatoria.id);
    try {
      const solicitud = await crearSolicitud(convocatoria.id);
      navegar(`/solicitudes/${solicitud.id}`);
    } catch (causa: unknown) {
      setErrorPostulacion(
        causa instanceof Error ? causa.message : 'No se pudo iniciar la solicitud.',
      );
    } finally {
      setPostulando(null);
    }
  }

  function accionPara(convocatoria: Convocatoria) {
    if (sesion === null) {
      return (
        <Link to="/login" state={{ destino: '/convocatorias' }} className="boton fantasma pequeno">
          Inicie sesión para postular
        </Link>
      );
    }
    if (!esEstudiante) return undefined;

    // El servidor rechaza postular fuera del periodo. Si el botón se ofrece igual, la persona
    // descubre la regla por un mensaje de error; mostrarla aquí la convierte en información.
    const plazo = estadoPlazo(convocatoria.fechaCierre, convocatoria.fechaApertura);
    if (!plazo.abierta) {
      return (
        <span className="pista">
          {plazo.clase === 'proximo'
            ? `Podrá postular a partir del ${formatearFecha(convocatoria.fechaApertura)}.`
            : 'El plazo de esta convocatoria ya cerró.'}
        </span>
      );
    }

    return (
      <button
        type="button"
        className="boton pequeno"
        disabled={postulando !== null}
        onClick={() => void postular(convocatoria)}
      >
        {postulando === convocatoria.id ? 'Iniciando…' : 'Postular'}
      </button>
    );
  }

  function cerrarSesion(): void {
    cerrar();
    // Se queda en el listado: es público, no hace falta echarlo al login.
    navegar('/convocatorias', { replace: true });
  }

  return (
    <>
      <Encabezado sesion={sesion} onCerrarSesion={cerrarSesion} />

      {/* Las cifras se calculan sobre el total, no sobre lo filtrado: describen
          el programa completo, no la búsqueda actual del usuario. */}
      {todas.length > 0 && <BandaEstadisticas convocatorias={todas} />}

      <div className="contenido">
        <div className="columnas">
          <PanelFiltros convocatorias={todas} tipoActivo={tipoActivo} onCambiar={setTipoActivo} />

          <main>
            <div className="barra-resultados">
              <h1>Convocatorias vigentes</h1>
              {!consulta.cargando && consulta.error === null && (
                <p className="conteo">
                  <strong>{visibles.length}</strong>{' '}
                  {visibles.length === 1 ? 'convocatoria' : 'convocatorias'}
                  {tipoActivo !== null && <> de {nombreTipo(tipoActivo).toLowerCase()}</>}
                </p>
              )}
            </div>

            {errorPostulacion !== null && (
              <p className="aviso error" role="alert" ref={avisoPostulacion}>
                {errorPostulacion}{' '}
                {errorPostulacion.startsWith('Complete su perfil') && (
                  <Link to="/perfil" state={{ volverA: '/convocatorias' }}>
                    Completar mi perfil
                  </Link>
                )}
                {errorPostulacion.startsWith('Ya tiene una solicitud') && (
                  <Link to="/solicitudes">Ver mis solicitudes</Link>
                )}
              </p>
            )}

            {consulta.cargando && (
              <ul className="lista" aria-busy="true" aria-label="Cargando convocatorias">
                <li className="esqueleto" />
                <li className="esqueleto" />
                <li className="esqueleto" />
              </ul>
            )}

            {/* Las pistas de desarrollo —levantar PostgreSQL, sembrar datos— solo se muestran
                mientras se trabaja en local. Un aspirante que entra desde su casa no tiene por
                qué leer un comando de npm en la pantalla: para él es ruido, y para el ministerio
                es una filtración de cómo está hecho el sistema por dentro. */}
            {consulta.error !== null && (
              <p className="aviso error" role="alert">
                No pudimos cargar las convocatorias en este momento. Vuelva a intentarlo en unos
                minutos.
                {import.meta.env.DEV && (
                  <>
                    {' '}
                    <span className="pista">
                      ({consulta.error} — ¿está levantada la base de datos?{' '}
                      <code>docker compose up -d</code>)
                    </span>
                  </>
                )}
              </p>
            )}

            {!consulta.cargando && consulta.error === null && visibles.length === 0 && (
              <p className="aviso">
                {todas.length === 0 ? (
                  <>
                    No hay convocatorias abiertas en este momento. Las nuevas se publican a lo largo
                    del año: vuelva a consultar más adelante.
                    {import.meta.env.DEV && (
                      <>
                        {' '}
                        <span className="pista">
                          (sin datos locales: <code>npm run db:seed</code>)
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    No hay convocatorias de {nombreTipo(tipoActivo ?? '').toLowerCase()} abiertas
                    ahora mismo. Pruebe con otro tipo de beca.
                  </>
                )}
              </p>
            )}

            {visibles.length > 0 && (
              <ul className="lista">
                {visibles.map((convocatoria) => (
                  <TarjetaConvocatoria
                    key={convocatoria.id}
                    convocatoria={convocatoria}
                    disponibles={disponibles.get(convocatoria.id)}
                    accion={accionPara(convocatoria)}
                  />
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>

      <footer className="pie">
        <div className="interior">
          <span>
            <strong>Plataforma Nacional de Becas</strong> · Ministerio de Educación de Guatemala
          </span>
          <span>
            Proyecto académico · Universidad Mariano Gálvez · Análisis de Sistemas II · Equipo
            ControlExe
          </span>
        </div>
      </footer>
    </>
  );
}
