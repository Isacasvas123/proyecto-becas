/**
 * Estructura común de las pantallas del estudiante: encabezado, contenido y pie.
 *
 * Existe para que perfil, mis solicitudes y detalle no repitan el mismo cierre de sesión y el
 * mismo pie. Cerrar sesión desde una pantalla privada lleva al listado público: quedarse en una
 * ruta protegida solo provocaría un salto al login.
 */
import type { ReactElement, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Encabezado } from './Encabezado';
import { useSesion } from '../sesion/ContextoSesion';

export function MarcoEstudiante({ children }: { children: ReactNode }): ReactElement {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();

  return (
    <>
      <Encabezado
        sesion={sesion}
        onCerrarSesion={() => {
          cerrar();
          navegar('/convocatorias', { replace: true });
        }}
      />
      <div className="contenido">
        <main className="estudiante">{children}</main>
      </div>
    </>
  );
}
