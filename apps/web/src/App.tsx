/**
 * Definición de rutas de la aplicación. No dibuja pantallas: declara qué ruta muestra qué página y
 * cuáles exigen sesión. Es el equivalente de `app.module.ts` en el backend, una raíz de
 * composición sin lógica propia.
 *
 *   /              → redirige a /convocatorias
 *   /convocatorias → PaginaConvocatorias   (pública, US-008)
 *   /login         → PaginaLogin           (pública)
 *   /registro      → PaginaRegistro        (pública, US-001)
 *   /consulta      → PaginaConsulta        (pública, US-025)
 *   /gestion       → PaginaGestion         (ADMINISTRADOR, US-006, US-007)
 *   /perfil        → PaginaPerfil          (ESTUDIANTE, US-011)
 *   /solicitudes   → PaginaMisSolicitudes  (ESTUDIANTE, US-015)
 *   /solicitudes/:id → PaginaSolicitud     (ESTUDIANTE, US-013, US-014, US-016)
 *   /evaluadores   → PaginaEvaluadores     (ADMINISTRADOR, US-017)
 *   /comites       → PaginaComites         (ADMINISTRADOR, US-017)
 *   /comites/:id   → PaginaComite          (ADMINISTRADOR, US-017, US-018, US-021)
 *   /evaluaciones  → PaginaEvaluaciones    (EVALUADOR, US-020)
 *   /evaluaciones/:id → PaginaEvaluar      (EVALUADOR, US-019)
 *   /reportes      → PaginaReportes        (ADMINISTRADOR, US-028 a US-031)
 *   /bitacora      → PaginaBitacora        (ADMINISTRADOR, US-032)
 *   /notificaciones → PaginaNotificaciones (ESTUDIANTE, US-022)
 *   cualquier otra → redirige a /convocatorias
 */
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PaginaComite } from './paginas/PaginaComite';
import { PaginaComites } from './paginas/PaginaComites';
import { PaginaConsulta } from './paginas/PaginaConsulta';
import { PaginaConvocatorias } from './paginas/PaginaConvocatorias';
import { PaginaEvaluaciones } from './paginas/PaginaEvaluaciones';
import { PaginaEvaluadores } from './paginas/PaginaEvaluadores';
import { PaginaEvaluar } from './paginas/PaginaEvaluar';
import { PaginaGestion } from './paginas/PaginaGestion';
import { PaginaLogin } from './paginas/PaginaLogin';
import { PaginaMisSolicitudes } from './paginas/PaginaMisSolicitudes';
import { PaginaPerfil } from './paginas/PaginaPerfil';
import { PaginaNotificaciones } from './paginas/PaginaNotificaciones';
import { PaginaRegistro } from './paginas/PaginaRegistro';
import { PaginaRecuperar } from './paginas/PaginaRecuperar';
import { PaginaBitacora } from './paginas/PaginaBitacora';
import { PaginaReportes } from './paginas/PaginaReportes';
import { PaginaSolicitud } from './paginas/PaginaSolicitud';
import { ProveedorSesion } from './sesion/ContextoSesion';
import { RutaProtegida } from './sesion/RutaProtegida';

export const ROL_ADMINISTRADOR = 'ADMINISTRADOR';
export const ROL_ESTUDIANTE = 'ESTUDIANTE';
export const ROL_EVALUADOR = 'EVALUADOR';

/** Una ruta que exige un rol. Solo usabilidad: la seguridad la pone el backend. */
const conRol = (rol: string, pagina: ReactElement) => (
  <RutaProtegida rol={rol}>{pagina}</RutaProtegida>
);

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
          {/* US-035. Dos rutas, una pantalla: con token se elige la contraseña, sin él se pide el enlace. */}
          <Route path="/recuperar" element={<PaginaRecuperar />} />
          <Route path="/recuperar/:token" element={<PaginaRecuperar />} />
          <Route path="/consulta" element={<PaginaConsulta />} />
          <Route
            path="/gestion"
            element={
              <RutaProtegida rol={ROL_ADMINISTRADOR}>
                <PaginaGestion />
              </RutaProtegida>
            }
          />
          <Route
            path="/perfil"
            element={
              <RutaProtegida rol={ROL_ESTUDIANTE}>
                <PaginaPerfil />
              </RutaProtegida>
            }
          />
          <Route
            path="/solicitudes"
            element={
              <RutaProtegida rol={ROL_ESTUDIANTE}>
                <PaginaMisSolicitudes />
              </RutaProtegida>
            }
          />
          <Route
            path="/solicitudes/:id"
            element={
              <RutaProtegida rol={ROL_ESTUDIANTE}>
                <PaginaSolicitud />
              </RutaProtegida>
            }
          />
          <Route path="/evaluadores" element={conRol(ROL_ADMINISTRADOR, <PaginaEvaluadores />)} />
          <Route path="/comites" element={conRol(ROL_ADMINISTRADOR, <PaginaComites />)} />
          <Route path="/comites/:id" element={conRol(ROL_ADMINISTRADOR, <PaginaComite />)} />
          <Route
            path="/notificaciones"
            element={conRol(ROL_ESTUDIANTE, <PaginaNotificaciones />)}
          />
          <Route path="/bitacora" element={conRol(ROL_ADMINISTRADOR, <PaginaBitacora />)} />
          <Route path="/reportes" element={conRol(ROL_ADMINISTRADOR, <PaginaReportes />)} />
          <Route path="/evaluaciones" element={conRol(ROL_EVALUADOR, <PaginaEvaluaciones />)} />
          <Route path="/evaluaciones/:id" element={conRol(ROL_EVALUADOR, <PaginaEvaluar />)} />
          {/* Una ruta inexistente no debe dejar la pantalla en blanco. */}
          <Route path="*" element={<Navigate to="/convocatorias" replace />} />
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
