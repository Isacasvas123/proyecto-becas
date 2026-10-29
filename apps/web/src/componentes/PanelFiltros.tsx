/**
 * Panel lateral de filtros por tipo de beca, con contadores, patrón tomado de tecoloco.com.gt. El
 * contador importa tanto como el filtro: antes de hacer clic el usuario ya sabe si vale la pena y
 * no acaba en una lista vacía.
 *
 * Filtra en el navegador sobre lo que ya se descargó. Con miles de convocatorias, el NFR de
 * rendimiento (menos de 1 segundo) exigiría filtrar en la base con paginación.
 */
import type { ReactElement } from 'react';

import type { Convocatoria } from '../api/cliente';
import { TIPOS_BECA, nombreTipo } from '../formato';

interface Props {
  convocatorias: Convocatoria[];
  tipoActivo: string | null;
  onCambiar: (tipo: string | null) => void;
}

export function PanelFiltros({ convocatorias, tipoActivo, onCambiar }: Props): ReactElement {
  const contar = (tipo: string) => convocatorias.filter((c) => c.tipo === tipo).length;

  return (
    <aside className="panel" aria-label="Filtrar convocatorias">
      <h2>Tipo de beca</h2>

      <ul className="facetas">
        <li>
          <button
            type="button"
            className="faceta"
            aria-pressed={tipoActivo === null}
            onClick={() => onCambiar(null)}
          >
            <span className="punto-tipo" style={{ background: 'var(--tinta-3)' }} />
            <span className="nombre">Todas</span>
            <span className="cuenta">{convocatorias.length}</span>
          </button>
        </li>

        {TIPOS_BECA.map((tipo) => {
          const cuenta = contar(tipo);

          return (
            <li key={tipo}>
              <button
                type="button"
                className="faceta"
                aria-pressed={tipoActivo === tipo}
                // Un tipo sin convocatorias se muestra pero no se puede pulsar:
                // ocultarlo haría que la lista de filtros cambiara de tamaño
                // entre visitas, y el usuario perdería la referencia.
                disabled={cuenta === 0}
                onClick={() => onCambiar(tipo)}
              >
                <span className="punto-tipo" style={{ background: `var(--${claveColor(tipo)})` }} />
                <span className="nombre">{nombreTipo(tipo)}</span>
                <span className="cuenta">{cuenta}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="nota-panel">
        Solo se listan convocatorias publicadas y dentro del plazo de postulación.
      </p>
    </aside>
  );
}

/** Variable CSS del color asignado a cada tipo, definida en `estilos.css`. */
function claveColor(tipo: string): string {
  switch (tipo) {
    case 'NIVEL_MEDIO':
      return 'medio';
    case 'POSGRADO':
      return 'posg';
    default:
      return 'univ';
  }
}
