/**
 * PÁGINA `/convocatorias` — listado de convocatorias de beca.
 *
 * DISEÑO: banda de cifras + panel de facetas + lista de tarjetas. Es el patrón
 * de una bolsa de empleo (computrabajo, tecoloco) y no el de una página de
 * presentación, porque la tarea real del usuario es **comparar** convocatorias
 * y decidir a cuál postular, no leer un texto corrido.
 *
 * PÁGINA PÚBLICA (US-008)
 *   Sin sesión. La historia dice textualmente: "Como **visitante**, quiero ver las
 *   convocatorias vigentes con sus requisitos y fechas, **sin necesidad de tener
 *   cuenta**". Es la necesidad de Ana, la aspirante de provincia
 *   (docs/03-vision-producto.md), y un requisito de transparencia del enunciado.
 *
 *   Hasta el Sprint 3 esta página exigía sesión, lo que incumplía la historia: era el
 *   defecto 3 del esqueleto. La gestión de convocatorias vive ahora en /gestion.
 *
 * El filtro es local, sobre lo ya descargado. El filtrado en servidor con paginación
 * se hará cuando el volumen lo justifique.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { listarConvocatorias, type Convocatoria } from '../api/cliente';
import { BandaEstadisticas } from '../componentes/BandaEstadisticas';
import { Encabezado } from '../componentes/Encabezado';
import { PanelFiltros } from '../componentes/PanelFiltros';
import { TarjetaConvocatoria } from '../componentes/TarjetaConvocatoria';
import { nombreTipo } from '../formato';
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

  useEffect(() => {
    let cancelado = false;

    listarConvocatorias()
      .then((datos) => {
        if (!cancelado) setConsulta({ datos, error: null, cargando: false });
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

            {consulta.cargando && (
              <ul className="lista" aria-busy="true" aria-label="Cargando convocatorias">
                <li className="esqueleto" />
                <li className="esqueleto" />
                <li className="esqueleto" />
              </ul>
            )}

            {consulta.error !== null && (
              <p className="aviso error" role="alert">
                {consulta.error} Si la API responde pero esta consulta falla, casi siempre es que
                PostgreSQL no está levantado: <code>docker compose up -d</code>.
              </p>
            )}

            {!consulta.cargando && consulta.error === null && visibles.length === 0 && (
              <p className="aviso">
                {todas.length === 0 ? (
                  <>
                    No hay convocatorias publicadas en este momento. Ejecute{' '}
                    <code>npm run db:seed</code> con la base de datos levantada para cargar datos de
                    prueba.
                  </>
                ) : (
                  <>
                    No hay convocatorias de {nombreTipo(tipoActivo ?? '').toLowerCase()} abiertas
                    ahora mismo.
                  </>
                )}
              </p>
            )}

            {visibles.length > 0 && (
              <ul className="lista">
                {visibles.map((convocatoria) => (
                  <TarjetaConvocatoria key={convocatoria.id} convocatoria={convocatoria} />
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
