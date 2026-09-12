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

/** Contrato de `POST /auth/login`. Refleja `SesionIniciadaDto` del backend. */
export interface Sesion {
  token: string;
  expiraEn: string;
  usuario: {
    id: string;
    nombreUsuario: string;
    correo: string;
    rol: string;
  };
}

/** Forma del cuerpo de error que devuelve `DominioExceptionFilter`. */
interface ErrorApi {
  mensaje?: string;
}

const URL_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Extrae el mensaje que envió la API.
 *
 * Se prefiere el texto del backend sobre uno inventado en el frontend: el criterio de
 * aceptación de US-002 exige un mensaje genérico e idéntico para cualquier fallo de
 * autenticación, y esa decisión pertenece al servidor. Si el frontend improvisara sus
 * propios mensajes, podría filtrar más información que la API.
 */
async function mensajeDelError(respuesta: Response, ruta: string): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as ErrorApi;
    if (typeof cuerpo.mensaje === 'string' && cuerpo.mensaje !== '') {
      return cuerpo.mensaje;
    }
  } catch {
    // La respuesta no traía JSON; se usa el mensaje genérico de abajo.
  }

  return `La API respondió ${respuesta.status} al consultar ${ruta}`;
}

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`);

  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }

  return (await respuesta.json()) as T;
}

async function enviar<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }

  return (await respuesta.json()) as T;
}

export function consultarSalud(): Promise<EstadoSalud> {
  return obtener<EstadoSalud>('/health');
}

export function listarConvocatorias(): Promise<Convocatoria[]> {
  return obtener<Convocatoria[]>('/convocatorias');
}

/** US-002 — Iniciar sesión. */
export function iniciarSesion(nombreUsuario: string, password: string): Promise<Sesion> {
  return enviar<Sesion>('/auth/login', { nombreUsuario, password });
}
