/**
 * PÁGINA `/gestion` — administración de convocatorias (US-006 y US-007).
 *
 * Solo con rol ADMINISTRADOR. Recordatorio que conviene repetir en cada pantalla protegida: la
 * guardia del frontend es usabilidad, la seguridad la pone el `RolesGuard` del backend. Si
 * alguien fuerza esta página, cada petición recibe 403.
 *
 * DISEÑO: una tabla y no tarjetas. El listado público usa tarjetas porque el aspirante
 * COMPARA convocatorias; el administrador las OPERA —revisar estados, publicar—, y para eso
 * una tabla densa con una acción por fila es más rápida de recorrer.
 *
 * ALCANCE: crear en borrador y publicar. Editar un borrador (US-010) y cerrar (US-009) todavía
 * no existen, y no se muestran botones que no llevan a ningún lado.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  listarConvocatoriasGestion,
  publicarConvocatoria,
  type Convocatoria,
} from '../api/cliente';
import { Encabezado } from '../componentes/Encabezado';
import { FormularioConvocatoria } from '../componentes/FormularioConvocatoria';
import { claseTipo, formatearFecha, nombreTipo } from '../formato';
import { useSesion } from '../sesion/ContextoSesion';

const NOMBRE_ESTADO: Record<string, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  CERRADA: 'Cerrada',
};

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
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
        texto: `${publicada.codigo} publicada. Ya es visible en el listado público.`,
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
    setAviso({ tipo: 'exito', texto: `${creada.codigo} creada en borrador.` });
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
              {aviso.texto}
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
