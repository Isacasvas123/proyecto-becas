/**
 * Cliente HTTP de la API. Es el único punto del frontend que sabe dónde vive el backend y cómo se
 * llaman sus rutas: los componentes no hacen `fetch`, así que un cambio de URL base, de
 * autenticación o de manejo de errores se hace aquí. Es el mismo aislamiento detrás de un contrato
 * que en el backend.
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
  /** PO, 17 Oct 2026: monto de la beca y si por eso exige doble aprobación. */
  montoBeca: number;
  exigeSegundaAprobacion: boolean;
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
  montoBeca: number;
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
 * Forma del cuerpo de error. Hay dos productores: `DominioExceptionFilter` responde con `mensaje`
 * (una cadena) y el `ValidationPipe` de NestJS con `message` (un arreglo, uno por campo inválido).
 * Se leen los dos para que un 400 de validación diga qué campo está mal y no un genérico "la API
 * respondió 400".
 */
interface ErrorApi {
  mensaje?: string;
  message?: string | string[];
}

const URL_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Extrae el mensaje que envió la API. Se prefiere el del backend sobre uno propio: US-002 exige un
 * mensaje genérico e idéntico ante cualquier fallo de autenticación, y esa decisión es del
 * servidor; un mensaje improvisado en el frontend podría filtrar más información.
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
 * Token de la sesión activa, en memoria del módulo y no en `localStorage`, donde cualquier script
 * de la página podría leerlo. Se guarda en el cliente HTTP y no en el contexto de React porque lo
 * necesita cada petición: si viviera solo en el contexto, bastaría que un componente olvidara
 * pasarlo para provocar un 401 inexplicable.
 *
 * `ContextoSesion` persiste la sesión en `sessionStorage` y la restaura aquí al recargar. Lo
 * correcto sería una cookie `httpOnly` emitida por el backend.
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

async function enviar<T>(
  ruta: string,
  cuerpo?: unknown,
  metodo: 'POST' | 'PUT' | 'DELETE' = 'POST',
): Promise<T> {
  // Con cabecera de sesión: hasta el Sprint 3 el único POST era el login, que no la
  // necesitaba. Crear y publicar convocatorias sí, y olvidarla aquí daría un 401 en cada
  // intento del administrador.
  //
  // Un archivo va como `FormData` y SIN `Content-Type`: el navegador lo pone él mismo con
  // el separador de partes. Si se fijara a mano, el servidor no podría leer el archivo.
  const esArchivo = cuerpo instanceof FormData;
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: cabecerasAutenticadas(esArchivo ? {} : { 'Content-Type': 'application/json' }),
    body: cuerpo === undefined ? undefined : esArchivo ? cuerpo : JSON.stringify(cuerpo),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }

  return (await respuesta.json()) as T;
}

/** Para rutas que responden 204: no hay cuerpo que leer, y `respuesta.json()` fallaría. */
async function enviarSinRespuesta(
  ruta: string,
  metodo: 'PUT' | 'DELETE' | 'POST',
  cuerpo?: unknown,
): Promise<void> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers:
      cuerpo === undefined
        ? cabecerasAutenticadas()
        : cabecerasAutenticadas({ 'Content-Type': 'application/json' }),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }
}

export function consultarSalud(): Promise<EstadoSalud> {
  return obtener<EstadoSalud>('/health');
}

export function listarConvocatorias(): Promise<Convocatoria[]> {
  return obtener<Convocatoria[]>('/convocatorias');
}

/**
 * Cupos restantes de las convocatorias vigentes. Público: no necesita sesión.
 *
 * Va aparte del listado porque el dato lo compone otro módulo del backend. Para la
 * pantalla son dos peticiones en paralelo y una sola espera.
 */
export function listarCuposPublicos(): Promise<Cupos[]> {
  return obtener<Cupos[]>('/resoluciones/cupos');
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
/**
 * US-035, paso 1. Responde 204 exista o no la cuenta, a propósito: si contestara distinto,
 * esta llamada serviría para averiguar quién está registrado en el sistema.
 */
export function solicitarRecuperacion(correo: string): Promise<void> {
  return enviarSinRespuesta('/auth/recuperacion', 'POST', { correo });
}

/** US-035, paso 2. Canjea el enlace del correo por una contraseña nueva. */
export function restablecerPassword(token: string, password: string): Promise<void> {
  return enviarSinRespuesta('/auth/recuperacion/confirmar', 'POST', { token, password });
}

export function iniciarSesion(nombreUsuario: string, password: string): Promise<Sesion> {
  return enviar<Sesion>('/auth/login', { nombreUsuario, password });
}

// ─── EPIC-03 · Perfil del estudiante (US-011) ─────────────────────────────────

/** Los datos editables del perfil. `null` es "todavía no lo llené". */
export interface DatosPerfil {
  centroEducativo: string | null;
  nivel: string | null;
  promedio: number | null;
  ingresoFamiliarMensual: number | null;
  dependientes: number | null;
  departamento: string | null;
  municipio: string | null;
}

/** Contrato de `GET/PUT /estudiantes/perfil`. */
export interface PerfilEstudiante extends DatosPerfil {
  completo: boolean;
  camposFaltantes: string[];
}

export function obtenerPerfil(): Promise<PerfilEstudiante> {
  return obtener<PerfilEstudiante>('/estudiantes/perfil');
}

export function guardarPerfil(datos: DatosPerfil): Promise<PerfilEstudiante> {
  return enviar<PerfilEstudiante>('/estudiantes/perfil', datos, 'PUT');
}

export function listarDepartamentos(): Promise<ElementoCatalogo[]> {
  return obtener<{ codigo: string; nombre: string }[]>('/estudiantes/departamentos').then((lista) =>
    lista.map((d) => ({ codigo: d.codigo, descripcion: d.nombre })),
  );
}

// ─── EPIC-03 · Solicitudes (US-012 a US-016) ──────────────────────────────────

export interface DocumentoDeSolicitud {
  tipo: string;
  descripcion: string;
  cargado: boolean;
  nombreArchivo: string | null;
  tamanoBytes: number | null;
  cargadoEn: string | null;
}

export interface EntradaHistorial {
  desde: string | null;
  hacia: string;
  motivo: string | null;
  ocurridoEn: string;
}

/** Refleja `SolicitudDto` del backend. */
export interface Solicitud {
  id: string;
  numero: string;
  estado: string;
  editable: boolean;
  convocatoria: { id: string; codigo: string; titulo: string; fechaCierre: string | null };
  documentos: DocumentoDeSolicitud[];
  documentosFaltantes: string[];
  historial: EntradaHistorial[];
  creadaEn: string;
  enviadaEn: string | null;
  /** US-024. */
  beca: { codigo: string; otorgadaEn: string } | null;
}

/** US-012. */
export function crearSolicitud(convocatoriaId: string): Promise<Solicitud> {
  return enviar<Solicitud>('/solicitudes', { convocatoriaId });
}

/** US-015. */
export function listarMisSolicitudes(): Promise<Solicitud[]> {
  return obtener<Solicitud[]>('/solicitudes');
}

export function obtenerSolicitud(id: string): Promise<Solicitud> {
  return obtener<Solicitud>(`/solicitudes/${encodeURIComponent(id)}`);
}

const rutaDocumento = (id: string, tipo: string) =>
  `/solicitudes/${encodeURIComponent(id)}/documentos/${encodeURIComponent(tipo)}`;

/** US-013. Carga o reemplaza el documento de ese tipo. */
export function cargarDocumento(id: string, tipo: string, archivo: File): Promise<Solicitud> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  return enviar<Solicitud>(rutaDocumento(id, tipo), formulario, 'PUT');
}

/**
 * El documento tal como se subió. Se descarga con la cabecera de sesión, por eso no basta un
 * enlace normal: el navegador no mandaría el token.
 */
export function descargarDocumento(id: string, tipo: string): Promise<Blob> {
  return descargarArchivo(rutaDocumento(id, tipo));
}

async function descargarArchivo(ruta: string): Promise<Blob> {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, { headers: cabecerasAutenticadas() });
  if (!respuesta.ok) {
    throw new Error(await mensajeDelError(respuesta, ruta));
  }
  return respuesta.blob();
}

/** US-014. */
export function enviarSolicitud(id: string): Promise<Solicitud> {
  return enviar<Solicitud>(`/solicitudes/${encodeURIComponent(id)}/enviar`);
}

// ─── EPIC-04 · Evaluación y comités (US-017 a US-021) ─────────────────────────

/** Contrato de `GET/POST /evaluadores`. Nunca trae el hash ni el CUI. */
export interface CuentaEvaluador {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export function listarEvaluadores(): Promise<CuentaEvaluador[]> {
  return obtener<CuentaEvaluador[]>('/evaluadores');
}

/** Mismo cuerpo que el registro público; el rol lo pone el servidor. */
export function crearEvaluador(datos: NuevoEstudiante): Promise<CuentaEvaluador> {
  return enviar<CuentaEvaluador>('/evaluadores', datos);
}

export interface IntegranteComite {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  asignadas: number;
  dictaminadas: number;
}

export interface Comite {
  id: string;
  nombre: string;
  convocatoria: { id: string; codigo: string; titulo: string; tipo: string; cupos: number };
  criterio: string;
  integrantes: IntegranteComite[];
  creadoPor: string;
  creadoEn: string;
}

export interface SolicitudPorAsignar {
  id: string;
  numero: string;
  enviadaEn: string | null;
}

export interface FilaConsolidado {
  solicitudId: string;
  numero: string;
  estado: string;
  estudiante: string;
  evaluadoresAsignados: number;
  dictamenesEmitidos: number;
  puntajePromedio: number | null;
  favorables: number;
  desfavorables: number;
  posicion: number | null;
  dentroDeCupos: boolean;
  /** Lo que dijo cada evaluador. Quien resuelve se apoya en esto, no en el conteo. */
  dictamenes: {
    evaluador: string;
    recomendacion: string;
    puntaje: number;
    observacion: string;
    emitidoEn: string;
  }[];
}

export interface Consolidado {
  comiteId: string;
  convocatoria: string;
  cupos: number;
  completas: number;
  filas: FilaConsolidado[];
}

export type PedidoAsignacion =
  | { modo: 'AUTOMATICO'; porSolicitud: number }
  | { modo: 'MANUAL'; asignaciones: { solicitudId: string; evaluadorIds: string[] }[] };

const rutaComite = (id: string) => `/comites/${encodeURIComponent(id)}`;

export function listarComites(): Promise<Comite[]> {
  return obtener<Comite[]>('/comites');
}

export function obtenerComite(id: string): Promise<Comite> {
  return obtener<Comite>(rutaComite(id));
}

/** US-017. */
export function crearComite(datos: {
  nombre: string;
  convocatoriaId: string;
  evaluadorIds: string[];
}): Promise<Comite> {
  return enviar<Comite>('/comites', datos);
}

export function agregarIntegrantes(id: string, evaluadorIds: string[]): Promise<Comite> {
  return enviar<Comite>(`${rutaComite(id)}/evaluadores`, { evaluadorIds });
}

/**
 * US-017, CU-13 flujo 5a. Sin `confirmado`, el servidor rechaza la operación si esa persona
 * tiene solicitudes pendientes y responde cuántas quedarían sin evaluador. La pantalla usa ese
 * mensaje para pedir la confirmación, en vez de calcular la cuenta por su lado.
 */
export function quitarIntegrante(
  id: string,
  evaluadorId: string,
  confirmado = false,
): Promise<Comite> {
  const ruta = `${rutaComite(id)}/evaluadores/${encodeURIComponent(evaluadorId)}`;
  return enviar<Comite>(confirmado ? `${ruta}?confirmar=true` : ruta, undefined, 'DELETE');
}

export function solicitudesPorAsignar(id: string): Promise<SolicitudPorAsignar[]> {
  return obtener<SolicitudPorAsignar[]>(`${rutaComite(id)}/por-asignar`);
}

/** US-018. */
export function asignarSolicitudes(
  id: string,
  pedido: PedidoAsignacion,
): Promise<{ solicitudes: number; asignaciones: number }> {
  return enviar(`${rutaComite(id)}/asignaciones`, pedido);
}

/** US-021. */
export function obtenerConsolidado(id: string): Promise<Consolidado> {
  return obtener<Consolidado>(`${rutaComite(id)}/consolidado`);
}

export interface LineaDesglose {
  concepto: string;
  valor: string;
  aporte: number;
}

export interface Dictamen {
  criterio: string;
  puntaje: number;
  desglose: LineaDesglose[];
  recomendacion: 'FAVORABLE' | 'DESFAVORABLE';
  observacion: string;
  emitidoEn: string;
}

/** US-020. */
export interface SolicitudAsignada {
  solicitudId: string;
  numero: string;
  estado: string;
  convocatoria: string;
  asignadaEn: string;
  dictaminada: boolean;
  puntaje: number | null;
  recomendacion: string | null;
}

export interface ExpedienteEvaluacion {
  solicitudId: string;
  numero: string;
  estado: string;
  convocatoria: string;
  solicitante: {
    nombreCompleto: string;
    centroEducativo: string | null;
    nivel: string | null;
    promedio: number | null;
    ingresoFamiliarMensual: number | null;
    dependientes: number | null;
    departamento: string | null;
    municipio: string | null;
  };
  documentos: {
    tipo: string;
    descripcion: string;
    cargado: boolean;
    nombreArchivo: string | null;
    tamanoBytes: number | null;
  }[];
  calculo: { criterio: string; puntaje: number; desglose: LineaDesglose[] } | null;
  problemaCalculo: string | null;
  puedeDictaminar: boolean;
  dictamen: Dictamen | null;
}

const rutaEvaluacion = (id: string) => `/evaluaciones/solicitudes/${encodeURIComponent(id)}`;

export function listarAsignadas(): Promise<SolicitudAsignada[]> {
  return obtener<SolicitudAsignada[]>('/evaluaciones/asignadas');
}

export function obtenerExpedienteEvaluacion(id: string): Promise<ExpedienteEvaluacion> {
  return obtener<ExpedienteEvaluacion>(rutaEvaluacion(id));
}

export function descargarDocumentoEvaluacion(id: string, tipo: string): Promise<Blob> {
  return descargarArchivo(`${rutaEvaluacion(id)}/documentos/${encodeURIComponent(tipo)}`);
}

// ─── EPIC-05 · Resolución, adjudicación y consulta pública (US-023 a US-025) ──

export interface Cupos {
  convocatoriaId: string;
  cupos: number;
  aprobadas: number;
  adjudicadas: number;
  disponibles: number;
}

export interface ResultadoResolucion {
  solicitudId: string;
  numero: string;
  estado: string;
  beca: { codigo: string; otorgadaEn: string } | null;
  cupos: Cupos;
}

const rutaResolucion = (id: string) => `/resoluciones/solicitudes/${encodeURIComponent(id)}`;

/** US-023. El motivo es obligatorio en los dos sentidos. */
export function resolverSolicitud(
  id: string,
  decision: 'APROBAR' | 'RECHAZAR',
  motivo: string,
): Promise<ResultadoResolucion> {
  return enviar<ResultadoResolucion>(rutaResolucion(id), { decision, motivo });
}

/**
 * Segunda aprobación (PO, 17 Oct 2026). La da una persona distinta de la que aprobó primero;
 * si es la misma, el servidor responde 422 y la pantalla muestra ese mensaje.
 */
export function confirmarAprobacion(id: string, motivo: string): Promise<ResultadoResolucion> {
  return enviar<ResultadoResolucion>(`${rutaResolucion(id)}/confirmar-aprobacion`, { motivo });
}

/** US-024. */
export function adjudicarBeca(id: string): Promise<ResultadoResolucion> {
  return enviar<ResultadoResolucion>(`${rutaResolucion(id)}/adjudicar`);
}

export function obtenerCupos(convocatoriaId: string): Promise<Cupos> {
  return obtener<Cupos>(`/resoluciones/convocatorias/${encodeURIComponent(convocatoriaId)}/cupos`);
}

/** Contrato de `POST /consulta-publica`: nada más que esto, por diseño (US-025). */
export interface EstadoPublico {
  numero: string;
  estado: string;
  ultimoCambio: string;
}

/** US-025. Sin sesión. El CUI viaja en el cuerpo, nunca en la URL. */
export function consultarEstadoPublico(numero: string, cui: string): Promise<EstadoPublico> {
  return enviar<EstadoPublico>('/consulta-publica', { numero, cui });
}

// ─── EPIC-06 · Reportes y estadísticas (US-028 a US-031) ──────────────────────

export type ValorReporte = string | number | null;

/** Refleja `Reporte` del backend: la misma forma para todos los reportes. */
export interface Reporte {
  titulo: string;
  nombre: string;
  generadoEn: string;
  filtros: { etiqueta: string; valor: string }[];
  columnas: { clave: string; titulo: string; numerica?: boolean }[];
  filas: Record<string, ValorReporte>[];
  agrupacion: string | null;
  grupos: { clave: string; etiqueta: string; total: number }[] | null;
  total: number;
}

export interface FiltrosReporte {
  convocatoriaId?: string;
  estado?: string[];
  nivel?: string;
  departamento?: string;
  desde?: string;
  hasta?: string;
  agruparPor?: string;
  ordenarPor?: string;
}

export interface Indicadores {
  recibidas: number;
  pendientesDeAsignar: number;
  enEvaluacion: number;
  aprobadas: number;
  rechazadas: number;
  adjudicadas: number;
  tasaAprobacion: number | null;
  cuposTotales: number;
  cuposDisponibles: number;
  diasPromedioResolucion: number | null;
}

export interface Panel extends Indicadores {
  generadoEn: string;
  convocatorias: (Indicadores & { id: string; codigo: string; titulo: string; estado: string })[];
}

/** Solo los filtros con valor; los vacíos no viajan. */
function consulta(parametros: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (Array.isArray(valor)) {
      if (valor.length > 0) q.set(clave, valor.join(','));
    } else if (valor) {
      q.set(clave, valor);
    }
  }
  const texto = q.toString();
  return texto === '' ? '' : `?${texto}`;
}

/** US-028. */
export function obtenerReporteSolicitudes(filtros: FiltrosReporte): Promise<Reporte> {
  return obtener<Reporte>(`/reportes/solicitudes${consulta({ ...filtros })}`);
}

/** US-029. */
export function obtenerPanel(convocatoriaId?: string): Promise<Panel> {
  return obtener<Panel>(`/reportes/panel${consulta({ convocatoriaId })}`);
}

/** US-031. */
export function obtenerReporteRegiones(convocatoriaId?: string): Promise<Reporte> {
  return obtener<Reporte>(`/reportes/regiones${consulta({ convocatoriaId })}`);
}

/** US-030. Devuelve el archivo; el nombre lo decide quien llama. */
export function exportarReporte(
  tipo: 'solicitudes' | 'regiones',
  filtros: FiltrosReporte,
  formato: 'CSV' | 'PDF',
): Promise<Blob> {
  return descargarArchivo(`/reportes/${tipo}${consulta({ ...filtros, formato })}`);
}

/** US-019. El puntaje no se manda: lo calcula el servidor con el criterio del tipo de beca. */
export function emitirDictamen(
  id: string,
  datos: { recomendacion: 'FAVORABLE' | 'DESFAVORABLE'; observacion: string },
): Promise<Dictamen> {
  return enviar<Dictamen>(`${rutaEvaluacion(id)}/dictamen`, datos);
}

// ─── Bitácora (auditoría) ─────────────────────────────────────────────────────

export interface RegistroBitacora {
  actor: string | null;
  rol: string | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  resultado: number;
  rechazada: boolean;
  origen: string | null;
  ocurridoEn: string;
}

export interface PaginaBitacora {
  registros: RegistroBitacora[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

export interface FiltrosBitacora {
  rol?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  soloRechazadas?: string;
  pagina?: string;
}

/** Solo administración. Consultar la bitácora queda, a su vez, registrado en la bitácora. */
export function consultarBitacora(filtros: FiltrosBitacora): Promise<PaginaBitacora> {
  return obtener<PaginaBitacora>(`/bitacora${consulta({ ...filtros })}`);
}

export function entidadesBitacora(): Promise<string[]> {
  return obtener<string[]>('/bitacora/entidades');
}

// ─── Notificaciones del estudiante (US-022) ───────────────────────────────────

export interface Notificacion {
  id: string;
  solicitudId: string;
  numero: string;
  estado: string;
  mensaje: string;
  motivo: string | null;
  leida: boolean;
  creadaEn: string;
}

export interface BandejaNotificaciones {
  sinLeer: number;
  notificaciones: Notificacion[];
}

/** Cada estudiante ve solo las suyas: el servidor las filtra por el token, no por la URL. */
export function obtenerNotificaciones(): Promise<BandejaNotificaciones> {
  return obtener<BandejaNotificaciones>('/notificaciones');
}

export function marcarNotificacionLeida(id: string): Promise<void> {
  return enviarSinRespuesta(`/notificaciones/${encodeURIComponent(id)}/leida`, 'PUT');
}

export function marcarTodasLeidas(): Promise<{ marcadas: number }> {
  return enviar<{ marcadas: number }>('/notificaciones/leidas', undefined, 'PUT');
}
