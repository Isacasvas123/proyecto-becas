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
 *
 * NAVEGACIÓN (Sprint 3)
 *   Desde que el listado es público, el encabezado tiene que servir a dos personas: al
 *   visitante, que necesita un camino para iniciar sesión, y al administrador, que necesita
 *   llegar a la gestión. El enlace de gestión solo se muestra con ese rol; esconderlo no
 *   protege nada —lo protege el backend—, solo evita ofrecer una puerta que devolvería 403.
 */
import type { ReactElement } from 'react';
import { Link, NavLink } from 'react-router-dom';

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

          <nav className="navegacion" aria-label="Secciones">
            <NavLink to="/convocatorias">Convocatorias</NavLink>
            {sesion?.usuario.rol !== 'ADMINISTRADOR' && sesion?.usuario.rol !== 'EVALUADOR' && (
              <NavLink to="/consulta">Consultar estado</NavLink>
            )}
            {sesion?.usuario.rol === 'ADMINISTRADOR' && (
              <>
                <NavLink to="/gestion">Gestión</NavLink>
                <NavLink to="/comites">Comités</NavLink>
                <NavLink to="/evaluadores">Evaluadores</NavLink>
              </>
            )}
            {sesion?.usuario.rol === 'EVALUADOR' && (
              <NavLink to="/evaluaciones">Mis evaluaciones</NavLink>
            )}
            {sesion?.usuario.rol === 'ESTUDIANTE' && (
              <>
                <NavLink to="/solicitudes">Mis solicitudes</NavLink>
                <NavLink to="/perfil">Mi perfil</NavLink>
              </>
            )}
          </nav>

          {sesion === null && (
            <div className="acciones-visitante">
              <Link to="/registro" className="boton fantasma pequeno">
                Crear cuenta
              </Link>
              <Link to="/login" className="boton pequeno">
                Iniciar sesión
              </Link>
            </div>
          )}

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
