/**
 * PÁGINA `/login` — inicio de sesión (US-002).
 *
 * Al autenticarse correctamente redirige a `/convocatorias`, o a la página que el usuario
 * intentaba abrir antes de que la guardia lo enviara aquí.
 *
 * ALCANCE (Sprint 1): solo el inicio de sesión. El enlace a "crear cuenta" (US-001) y a
 * "olvidé mi contraseña" (US-005) aparecerá en el Sprint 2, cuando esas historias existan.
 * No se ponen ahora enlaces que no llevan a ningún lado.
 */
import { useEffect, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FormularioLogin } from '../componentes/FormularioLogin';
import { useSesion } from '../sesion/ContextoSesion';

interface EstadoNavegacion {
  destino?: string;
}

export function PaginaLogin(): ReactElement {
  const { sesion, iniciar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const destino = (ubicacion.state as EstadoNavegacion | null)?.destino ?? '/convocatorias';

  // Si ya hay sesión no tiene sentido mostrar el formulario: se sale de aquí.
  // Va en un efecto y no en el cuerpo del componente porque navegar es un efecto
  // secundario, y hacerlo durante el render es un error en React.
  useEffect(() => {
    if (sesion !== null) {
      navegar(destino, { replace: true });
    }
  }, [sesion, destino, navegar]);

  return (
    <main className="contenedor contenedor-centrado">
      <header className="encabezado-login">
        <p className="etiqueta">Ministerio de Educación</p>
        <h1>Plataforma Nacional de Becas</h1>
        <p className="subtitulo">Ingrese con sus credenciales para continuar.</p>
      </header>

      <FormularioLogin
        onSesionIniciada={(nueva) => {
          iniciar(nueva);
          navegar(destino, { replace: true });
        }}
      />

      <footer className="atenuado">
        Universidad Mariano Gálvez · Análisis de Sistemas II · Isaac · Ivan · Fernando · Stuard
      </footer>
    </main>
  );
}
