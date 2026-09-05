/**
 * Encabezado institucional.
 *
 * Tres franjas, como en los portales del Estado (becas.segeplan.gob.gt,
 * becasnuestrofuturo.gob.gt):
 *
 *   1. Franja de gobierno — identifica de qué institución depende el sistema
 *   2. Marca del programa — emblema, entidad y nombre de la plataforma
 *   3. Cenefa geométrica — separa la identidad del contenido
 *
 * Esa jerarquía no es decorativa: en un trámite público el ciudadano necesita
 * saber de inmediato ante qué institución está actuando.
 */
import type { ReactElement } from 'react';

import { Emblema } from './Iconos';
import type { Sesion } from '../api/cliente';

interface Props {
  sesion?: Sesion | null;
  onCerrarSesion?: () => void;
}

export function Encabezado({ sesion = null, onCerrarSesion }: Props): ReactElement {
  return (
    <>
      <div className="franja-gobierno">
        <div className="interior">
          <span>Gobierno de Guatemala · Ministerio de Educación</span>
          <span>Fondo Nacional de Becas</span>
        </div>
      </div>

      <header className="encabezado">
        <div className="interior">
          <div className="marca">
            <Emblema />
            <div>
              <div className="institucion">Ministerio de Educación</div>
              <div className="titulo">Plataforma Nacional de Becas</div>
            </div>
          </div>

          {sesion !== null && (
            <div className="sesion-chip">
              <span className="avatar" aria-hidden="true">
                {sesion.usuario.nombreUsuario.slice(0, 2).toUpperCase()}
              </span>
              <span className="quien">
                <span className="nombre">{sesion.usuario.nombreUsuario}</span>
                <br />
                <span className="rol">{sesion.usuario.rol}</span>
              </span>
              {onCerrarSesion && (
                <button type="button" className="boton fantasma pequeno" onClick={onCerrarSesion}>
                  Cerrar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="cenefa" aria-hidden="true" />
    </>
  );
}
