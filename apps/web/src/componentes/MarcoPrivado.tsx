/**
 * Estructura común de las pantallas con sesión (estudiante, evaluador y administración):
 * encabezado y contenido.
 *
 * Existe para que cada pantalla no repita el mismo cierre de sesión. Cerrar sesión desde una pantalla privada lleva al listado público: quedarse en una
 * ruta protegida solo provocaría un salto al login.
 */
import type { ReactElement, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Encabezado } from './Encabezado';
import { useSesion } from '../sesion/ContextoSesion';

export function MarcoPrivado({ children }: { children: ReactNode }): ReactElement {
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
        <main className="privada">{children}</main>
      </div>
    </>
  );
}
