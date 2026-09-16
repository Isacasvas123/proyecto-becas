/**
 * Definición de rutas de la aplicación.
 *
 * Este archivo no dibuja pantallas: solo declara qué ruta muestra qué página y cuáles
 * exigen sesión. Es el equivalente en el frontend a `app.module.ts` en el backend — una
 * raíz de composición, sin lógica propia.
 *
 * MAPA DE RUTAS
 *   /              → redirige a /convocatorias
 *   /convocatorias → PaginaConvocatorias (PÚBLICA — US-008)
 *   /login         → PaginaLogin         (pública)
 *   /registro      → PaginaRegistro      (pública — US-001)
 *   /gestion       → PaginaGestion       (sesión + rol ADMINISTRADOR — US-006, US-007)
 *   cualquier otra → redirige a /convocatorias
 *
 * EL CAMBIO DEL SPRINT 3
 *   Hasta aquí /convocatorias exigía sesión, y eso incumplía US-008: la historia pide que un
 *   VISITANTE vea las convocatorias sin cuenta. Era el defecto 3 del esqueleto. Ahora el
 *   listado es público y lo que queda detrás del login es la gestión.
 */
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PaginaConvocatorias } from './paginas/PaginaConvocatorias';
import { PaginaGestion } from './paginas/PaginaGestion';
import { PaginaLogin } from './paginas/PaginaLogin';
import { PaginaRegistro } from './paginas/PaginaRegistro';
import { ProveedorSesion } from './sesion/ContextoSesion';
import { RutaProtegida } from './sesion/RutaProtegida';

export const ROL_ADMINISTRADOR = 'ADMINISTRADOR';

export function App(): ReactElement {
  return (
    // El proveedor envuelve al enrutador para que la sesión sobreviva a los cambios de
    // ruta. Si estuviera dentro, se reiniciaría al navegar y se perdería la sesión.
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/convocatorias" replace />} />
          <Route path="/convocatorias" element={<PaginaConvocatorias />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route
            path="/gestion"
            element={
              <RutaProtegida rol={ROL_ADMINISTRADOR}>
                <PaginaGestion />
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
