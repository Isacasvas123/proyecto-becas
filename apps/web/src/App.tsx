/**
 * Pantalla única del walking skeleton.
 *
 * QUÉ DEMUESTRA: que el frontend habla de verdad con la API. Consume los dos endpoints
 * del esqueleto —`GET /health` y `GET /convocatorias`— y muestra el resultado.
 *
 * ALCANCE (Sprint 1 · US-S1-08): esto NO es la pantalla de US-008. El listado público
 * definitivo —con filtro por tipo de beca y diseño adaptado a móvil— es SPRINT 3. Aquí
 * solo se comprueba que la rebanada vertical atraviesa el sistema completo.
 *
 * Cuando el frontend crezca, esta pantalla se moverá a `src/paginas/` y el estado
 * compartido saldrá de los componentes. Por ahora, cuanto menos código, mejor.
 */
import { useEffect, useState, type ReactElement } from 'react';

import {
  consultarSalud,
  listarConvocatorias,
  type Convocatoria,
  type EstadoSalud,
  type Sesion,
} from './api/cliente';
import { FormularioLogin } from './componentes/FormularioLogin';

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Estado de una consulta a la API: cargando, con datos o con error.
 * Modelarlo así evita el clásico "cargando eterno" cuando la petición falla.
 */
interface Consulta<T> {
  datos: T | null;
  error: string | null;
  cargando: boolean;
}

const INICIAL = { datos: null, error: null, cargando: true };

function mensajeDeError(causa: unknown): string {
  return causa instanceof Error
    ? causa.message
    : 'No se pudo contactar con la API. ¿Está corriendo `npm run dev`?';
}

/**
 * Hook que ejecuta UNA consulta y expone su estado.
 *
 * Cada endpoint se consulta por separado, a propósito: si la base de datos está caída,
 * `GET /convocatorias` falla pero `GET /health` sigue respondiendo, y la pantalla debe
 * mostrar esa diferencia. Con un `Promise.all` el fallo de una consulta ocultaría el
 * resultado de la otra, que es justo la información que se necesita para diagnosticar.
 */
function useConsulta<T>(consultar: () => Promise<T>): Consulta<T> {
  const [estado, setEstado] = useState<Consulta<T>>(INICIAL);

  useEffect(() => {
    let cancelado = false;

    consultar()
      .then((datos) => {
        if (!cancelado) setEstado({ datos, error: null, cargando: false });
      })
      .catch((causa: unknown) => {
        if (!cancelado) setEstado({ datos: null, error: mensajeDeError(causa), cargando: false });
      });

    return () => {
      cancelado = true;
    };
    // Se ejecuta una sola vez al montar: `consultar` se define a nivel de módulo y es
    // estable entre renders.
  }, [consultar]);

  return estado;
}

export function App(): ReactElement {
  const salud = useConsulta<EstadoSalud>(consultarSalud);
  const listado = useConsulta<Convocatoria[]>(listarConvocatorias);
  const convocatorias = listado.datos ?? [];

  /**
   * La sesión se guarda SOLO en memoria, no en `localStorage`.
   *
   * Es una decisión deliberada: un token en `localStorage` es legible por cualquier
   * script de la página, así que una vulnerabilidad XSS bastaría para robarlo. El precio
   * es que al recargar la página hay que volver a iniciar sesión.
   *
   * SPRINT 2 (US-002/US-003): la persistencia correcta de la sesión es una cookie
   * `httpOnly` emitida por el backend, que el JavaScript no puede leer. Se implementa
   * junto con el guard que valida el token en cada petición.
   */
  const [sesion, setSesion] = useState<Sesion | null>(null);

  return (
    <main className="contenedor">
      <header>
        <p className="etiqueta">Ministerio de Educación</p>
        <h1>Plataforma Nacional de Becas</h1>
        <p className="subtitulo">
          Walking skeleton — Sprint 1. Rebanada vertical de referencia: React → API REST →
          aplicación → dominio → persistencia.
        </p>
      </header>

      <section aria-labelledby="titulo-sesion">
        <h2 id="titulo-sesion">Acceso</h2>

        {sesion === null ? (
          <FormularioLogin onSesionIniciada={setSesion} />
        ) : (
          <div className="sesion">
            <p>
              Sesión iniciada como <strong>{sesion.usuario.nombreUsuario}</strong>
              <span className="insignia">{sesion.usuario.rol}</span>
            </p>
            <p className="atenuado">
              {sesion.usuario.correo} · expira el{' '}
              {new Date(sesion.expiraEn).toLocaleString('es-GT')}
            </p>
            <button type="button" className="secundario" onClick={() => setSesion(null)}>
              Cerrar sesión
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-salud">
        <h2 id="titulo-salud">Estado de la API</h2>
        {salud.cargando && <p className="atenuado">Consultando…</p>}
        {salud.datos && (
          <p className="salud">
            <span className="punto" aria-hidden="true" />
            <strong>{salud.datos.status}</strong>
            <span className="atenuado">
              {' '}
              · {new Date(salud.datos.timestamp).toLocaleString('es-GT')}
            </span>
          </p>
        )}
        {salud.error && <p className="error">{salud.error}</p>}
      </section>

      <section aria-labelledby="titulo-convocatorias">
        <h2 id="titulo-convocatorias">Convocatorias publicadas</h2>

        {listado.cargando && <p className="atenuado">Cargando convocatorias…</p>}

        {listado.error && (
          <p className="error">
            {listado.error}. Si la API responde pero esta consulta falla, casi siempre es que
            PostgreSQL no está levantado: <code>docker compose up -d</code>.
          </p>
        )}

        {!listado.cargando && !listado.error && convocatorias.length === 0 && (
          <p className="atenuado">
            No hay convocatorias publicadas. Ejecute <code>npm run db:seed</code> con la base de
            datos levantada para cargar datos de prueba.
          </p>
        )}

        <ul className="lista">
          {convocatorias.map((convocatoria) => (
            <li key={convocatoria.id} className="tarjeta">
              <div className="tarjeta-encabezado">
                <h3>{convocatoria.titulo}</h3>
                <span className="insignia">{convocatoria.tipo.replace('_', ' ')}</span>
              </div>
              <p className="descripcion">{convocatoria.descripcion}</p>
              <dl className="datos">
                <div>
                  <dt>Código</dt>
                  <dd>{convocatoria.codigo}</dd>
                </div>
                <div>
                  <dt>Cupos</dt>
                  <dd>{convocatoria.cupos}</dd>
                </div>
                <div>
                  <dt>Cierra</dt>
                  <dd>{formatearFecha(convocatoria.fechaCierre)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <footer className="atenuado">
        Universidad Mariano Gálvez · Análisis de Sistemas II · Isaac · Ivan · Fernando · Stuard
      </footer>
    </main>
  );
}
