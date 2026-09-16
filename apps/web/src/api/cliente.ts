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

/** Un requisito o documento: código estable para guardar, descripción para mostrar. */
export interface ElementoCatalogo {
  codigo: string;
  descripcion: string;
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
  requisitos: ElementoCatalogo[];
  documentosExigidos: ElementoCatalogo[];
}

/** Contrato de `GET /convocatorias/catalogo`. */
export interface CatalogoConvocatorias {
  requisitos: ElementoCatalogo[];
  documentos: ElementoCatalogo[];
  tipos: {
    tipo: string;
    requisitosPorDefecto: string[];
    documentosPorDefecto: string[];
  }[];
}

/** Cuerpo de `POST /convocatorias` (US-006). */
export interface NuevaConvocatoria {
  tipo: string;
  titulo: string;
  descripcion: string;
  cupos: number;
  fechaApertura: string;
  fechaCierre: string;
  requisitos: string[];
  documentosExigidos: string[];
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

/**
 * Forma del cuerpo de error.
 *
 * Dos productores distintos: `DominioExceptionFilter` responde con `mensaje` (una cadena),
 * y el `ValidationPipe` de NestJS con `message` (un arreglo, uno por campo inválido). Se leen
 * los dos para que un 400 de validación le diga al administrador QUÉ campo está mal en vez de
 * un genérico "la API respondió 400".
 */
interface ErrorApi {
  mensaje?: string;
  message?: string | string[];
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
    if (Array.isArray(cuerpo.message) && cuerpo.message.length > 0) {
      return cuerpo.message.join('. ');
    }
    if (typeof cuerpo.message === 'string' && cuerpo.message !== '') {
      return cuerpo.message;
    }
  } catch {
    // La respuesta no traía JSON; se usa el mensaje genérico de abajo.
  }

  return `La API respondió ${respuesta.status} al consultar ${ruta}`;
}

/**
 * Token de la sesión activa.
 *
 * Vive en memoria del módulo, no en `localStorage`: un token ahí es legible por cualquier
 * script de la página y un XSS bastaría para robarlo. El precio es que al recargar (F5) hay
 * que volver a iniciar sesión.
 *
 * Se guarda aquí, en el cliente HTTP, y no en el contexto de React, porque quien lo necesita
 * es cada petición. Si viviera solo en el contexto, cada componente tendría que acordarse de
 * pasarlo, y bastaría un olvido para provocar un 401 inexplicable.
 *
 * SPRINT 2 (US-003): la forma correcta de persistirlo es una cookie `httpOnly` emitida por
 * el backend, que el JavaScript no puede leer.
 */
let tokenActivo: string | null = null;

export function establecerToken(token: string | null): void {
  tokenActivo = token;
}

/**
 * Cabecera `Authorization` si hay sesión.
 *
 * El backend exige `Bearer` explícitamente: aceptar la cabecera pelada sería más cómodo y
 * menos seguro.
 */
function cabecerasAutenticadas(extra: HeadersInit = {}): HeadersInit {
  return tokenActivo === null ? extra : { ...extra, Authorization: `Bearer ${tokenActivo}` };
}

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    headers: cabecerasAutenticadas(),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }

  return (await respuesta.json()) as T;
}

async function enviar<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  // Con cabecera de sesión: hasta el Sprint 3 el único POST era el login, que no la
  // necesitaba. Crear y publicar convocatorias sí, y olvidarla aquí daría un 401 en cada
  // intento del administrador.
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: 'POST',
    headers: cabecerasAutenticadas({ 'Content-Type': 'application/json' }),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
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

/** Todas las convocatorias, incluidos borradores. Solo administración. */
export function listarConvocatoriasGestion(): Promise<Convocatoria[]> {
  return obtener<Convocatoria[]>('/convocatorias/gestion');
}

export function obtenerCatalogo(): Promise<CatalogoConvocatorias> {
  return obtener<CatalogoConvocatorias>('/convocatorias/catalogo');
}

/** US-006 — Crear convocatoria. Nace en BORRADOR. */
export function crearConvocatoria(datos: NuevaConvocatoria): Promise<Convocatoria> {
  return enviar<Convocatoria>('/convocatorias', datos);
}

/** US-007 — Publicar convocatoria. */
export function publicarConvocatoria(id: string): Promise<Convocatoria> {
  return enviar<Convocatoria>(`/convocatorias/${encodeURIComponent(id)}/publicar`);
}

/** Cuerpo de `POST /auth/registro` (US-001). */
export interface NuevoEstudiante {
  nombreCompleto: string;
  cui: string;
  correo: string;
  nombreUsuario: string;
  password: string;
}

/** US-001 — Registro de estudiante. Devuelve la sesión ya iniciada. */
export function registrarEstudiante(datos: NuevoEstudiante): Promise<Sesion> {
  return enviar<Sesion>('/auth/registro', datos);
}

/** US-002 — Iniciar sesión. */
export function iniciarSesion(nombreUsuario: string, password: string): Promise<Sesion> {
  return enviar<Sesion>('/auth/login', { nombreUsuario, password });
}
