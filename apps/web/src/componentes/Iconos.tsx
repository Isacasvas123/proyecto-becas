/**
 * Iconos del sistema, dibujados como SVG inline. Son ocho y traer una librería sumaría peso de
 * descarga y una dependencia, con un NFR de cargar en menos de 3 segundos con 3G
 * (docs/04-product-backlog.md §5). Comparten el grosor de trazo y la caja de 24 para verse como
 * una familia.
 */
import type { ReactElement } from 'react';

interface Props {
  size?: number;
  className?: string;
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

/**
 * Emblema del programa.
 *
 * Es una marca propia y abstracta —birrete sobre un arco— y NO una
 * reproducción del escudo nacional: este es un proyecto académico y no debe
 * suplantar la identidad gráfica oficial del Estado.
 */
export function Emblema({ size = 42 }: Props): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Emblema de la Plataforma Nacional de Becas"
      className="emblema"
    >
      <rect width="48" height="48" rx="10" fill="var(--gob-700)" />
      <path d="M24 13 38 20 24 27 10 20Z" fill="var(--gob-300)" />
      <path d="M24 13 38 20 24 27Z" fill="#fff" opacity="0.9" />
      <path
        d="M15 23v7c0 2.6 4 4.6 9 4.6s9-2 9-4.6v-7"
        stroke="#fff"
        strokeWidth="2.4"
        fill="none"
      />
      <circle cx="38" cy="20" r="1.9" fill="var(--ambar)" />
      <path d="M38 22v6" stroke="var(--ambar)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconoCalendario({ size = 15 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function IconoCupos({ size = 15 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.9" />
    </svg>
  );
}

export function IconoCodigo({ size = 15 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <path d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconoReloj({ size = 14 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconoBuscar({ size = 18 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconoEscudo({ size = 16 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <path d="M12 3 5 6v5.5c0 4.3 3 8.2 7 9.5 4-1.3 7-5.2 7-9.5V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconoDocumento({ size = 16 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function IconoLupa({ size = 16 }: Props): ReactElement {
  return (
    <svg {...base(size)}>
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}
