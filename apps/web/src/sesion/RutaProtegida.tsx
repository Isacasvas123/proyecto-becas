/**
 * Guardia de rutas del frontend.
 *
 * Si no hay sesión, redirige a `/login` en lugar de mostrar la página.
 *
 * ⚠️  ESTO NO ES SEGURIDAD, ES USABILIDAD.
 *   Todo lo que ocurre en el navegador lo puede saltar cualquiera con las herramientas de
 *   desarrollo. Esta guardia solo evita que un usuario legítimo vea una pantalla vacía o
 *   un error. La seguridad REAL vive en el backend: es el `JwtAuthGuard` que valida el
 *   token en cada petición, y corresponde a US-003 en el Sprint 2.
 *
 *   Es una pregunta que el catedrático puede hacer en la defensa: "si escondo el botón en
 *   el frontend, ¿ya está protegido?". La respuesta es no.
 */
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

import { useSesion } from './ContextoSesion';

export function RutaProtegida({ children }: { children: ReactNode }): ReactElement {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  if (sesion === null) {
    // Se recuerda a dónde quería ir para llevarlo ahí después de autenticarse, en vez de
    // dejarlo siempre en la página de inicio.
    return <Navigate to="/login" state={{ destino: ubicacion.pathname }} replace />;
  }

  return <>{children}</>;
}
