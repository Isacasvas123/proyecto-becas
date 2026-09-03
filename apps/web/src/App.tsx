/**
 * Definición de rutas de la aplicación.
 *
 * Este archivo ya no dibuja pantallas: solo declara qué ruta muestra qué página y cuáles
 * exigen sesión. Es el equivalente en el frontend a `app.module.ts` en el backend — una
 * raíz de composición, sin lógica propia.
 *
 * MAPA DE RUTAS
 *   /              → redirige a /convocatorias
 *   /login         → PaginaLogin        (pública)
 *   /convocatorias → PaginaConvocatorias (protegida)
 *   cualquier otra → redirige a /convocatorias
 *
 * SPRINT 2 y 3: aquí se agregarán /registro (US-001), /perfil (US-004), /solicitudes
 * (EPIC-03) y el panel de administración. Cuando esta lista crezca, conviene separarla
 * en `src/rutas/`.
 */
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PaginaConvocatorias } from './paginas/PaginaConvocatorias';
import { PaginaLogin } from './paginas/PaginaLogin';
import { ProveedorSesion } from './sesion/ContextoSesion';
import { RutaProtegida } from './sesion/RutaProtegida';

export function App(): ReactElement {
  return (
    // El proveedor envuelve al enrutador para que la sesión sobreviva a los cambios de
    // ruta. Si estuviera dentro, se reiniciaría al navegar y se perdería la sesión.
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/convocatorias" replace />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route
            path="/convocatorias"
            element={
              <RutaProtegida>
                <PaginaConvocatorias />
              </RutaProtegida>
            }
          />
          {/* Una ruta inexistente no debe dejar la pantalla en blanco. */}
          <Route path="*" element={<Navigate to="/convocatorias" replace />} />
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
