/**
 * Cliente HTTP de la API.
 *
 * Único punto del frontend que sabe dónde vive el backend y cómo se llaman sus rutas.
 * Los componentes no hacen `fetch` directamente: si mañana cambia la URL base, la
 * autenticación o el manejo de errores, se cambia aquí y nada más.
 *
 * Es el mismo razonamiento que en el backend —aislar el detalle detrás de un contrato—
 * aplicado al frontend.
 */

/** Contrato de `GET /health`. */
export interface EstadoSalud {
  status: string;
  timestamp: string;
}

/**
 * Contrato de `GET /convocatorias`.
 * Refleja `ConvocatoriaResponseDto` del backend. Mantener ambos en sintonía es parte de
 * la Definition of Done cuando se toca el contrato de la API.
 */
export interface Convocatoria {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  cupos: number;
  fechaApertura: string;
  fechaCierre: string;
}

const URL_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`);

  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status} al consultar ${ruta}`);
  }

  return (await respuesta.json()) as T;
}

export function consultarSalud(): Promise<EstadoSalud> {
  return obtener<EstadoSalud>('/health');
}

export function listarConvocatorias(): Promise<Convocatoria[]> {
  return obtener<Convocatoria[]>('/convocatorias');
}
