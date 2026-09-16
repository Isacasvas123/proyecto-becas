/**
 * PÁGINA `/registro` — registro de estudiante (US-001).
 *
 * Misma composición de dos columnas que el inicio de sesión: quien llega a crear una cuenta en un
 * portal del Estado necesita ver primero ante qué institución la está creando y para qué.
 *
 * Criterio 5 de US-001: al registrarse la persona queda autenticada y va a su panel. Recién
 * registrada no tiene solicitudes, y no puede postular sin perfil completo (US-011, criterio 3),
 * así que su primer paso útil es el perfil.
 */
import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormularioRegistro } from '../componentes/FormularioRegistro';
import { Emblema, IconoDocumento, IconoEscudo, IconoLupa } from '../componentes/Iconos';
import { useSesion } from '../sesion/ContextoSesion';

const PANEL_ESTUDIANTE = '/perfil';

export function PaginaRegistro(): ReactElement {
  const { sesion, iniciar } = useSesion();
  const navegar = useNavigate();

  // Quien ya tiene sesión no necesita registrarse.
  useEffect(() => {
    if (sesion !== null) {
      navegar(PANEL_ESTUDIANTE, { replace: true });
    }
  }, [sesion, navegar]);

  return (
    <div className="acceso">
      <section className="presentacion">
        <div className="marca" style={{ gap: '0.75rem' }}>
          <Emblema size={44} />
          <div>
            <div className="institucion" style={{ color: 'var(--gob-300)' }}>
              Ministerio de Educación
            </div>
            <div className="titulo" style={{ color: '#fff' }}>
              Fondo Nacional de Becas
            </div>
          </div>
        </div>

        <h1>Una cuenta para todo su trámite de beca</h1>

        <p className="entrada">
          Con una sola cuenta podrá postular a las convocatorias abiertas, subir sus documentos y
          dar seguimiento a su solicitud, sin trasladarse a la capital.
        </p>

        <ul className="puntos">
          <li>
            <span className="icono">
              <IconoLupa />
            </span>
            <span>
              <b>Una cuenta por persona</b>
              Se identifica con su CUI, el mismo número de su DPI o de su certificado de nacimiento.
            </span>
          </li>
          <li>
            <span className="icono">
              <IconoEscudo />
            </span>
            <span>
              <b>Su contraseña, cifrada</b>
              Nadie en el Ministerio puede verla. Por eso le pedimos que sea segura.
            </span>
          </li>
          <li>
            <span className="icono">
              <IconoDocumento />
            </span>
            <span>
              <b>Todo su expediente en un lugar</b>
              Solicitudes, documentos y resoluciones, con la fecha de cada cambio.
            </span>
          </li>
        </ul>
      </section>

      <section className="formulario-zona">
        <FormularioRegistro
          onRegistrado={(nueva) => {
            iniciar(nueva);
            navegar(PANEL_ESTUDIANTE, { replace: true });
          }}
        />
      </section>
    </div>
  );
}
