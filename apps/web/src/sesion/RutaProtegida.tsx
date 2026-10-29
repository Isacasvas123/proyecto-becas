/**
 * Guardia de rutas del frontend: sin sesión, redirige a `/login`.
 *
 * Esto es usabilidad y no seguridad. Todo lo que ocurre en el navegador se puede saltar con las
 * herramientas de desarrollo; la guardia solo evita que un usuario legítimo vea una pantalla vacía
 * o un error. La seguridad real está en el backend: `AutenticacionGuard` valida el token en cada
 * petición (US-003).
 */
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

import { useSesion } from './ContextoSesion';

interface Props {
  children: ReactNode;
  /** Si se indica, además de sesión exige este rol. Sin rol suficiente, vuelve al listado. */
  rol?: string;
}

export function RutaProtegida({ children, rol }: Props): ReactElement {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  if (sesion === null) {
    // Se recuerda a dónde quería ir para llevarlo ahí después de autenticarse, en vez de
    // dejarlo siempre en la página de inicio.
    return <Navigate to="/login" state={{ destino: ubicacion.pathname }} replace />;
  }

  if (rol !== undefined && sesion.usuario.rol !== rol) {
    // Recordatorio del comentario de arriba: esto NO protege nada. Si alguien fuerza la
    // pantalla, cada petición de gestión recibe 403 del `RolesGuard` del backend.
    return <Navigate to="/convocatorias" replace />;
  }

  return <>{children}</>;
}
