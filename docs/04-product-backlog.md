# Product Backlog Inicial
### Anexo 4, secciones 4, 5 y 6 — Proyecto Final, Análisis de Sistemas II

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Product Owner** | Ing. Mario Fuentes |
| **Responsable del backlog** | Isaac (Scrum Master) |
| **Fecha** | 3 de septiembre de 2026 · **Versión** 1.0 |

> El backlog es la única fuente de requisitos del proyecto. Se refina cada jueves en la
> Sprint Review y el Product Owner es quien prioriza. Las estimaciones en Puntos de Historia se
> confirman en cada Sprint Planning.

---

## Epics

| ID | Epic | Sprint objetivo |
|---|---|---|
| **EPIC-01** | Gestión de cuentas y control de acceso | 2 |
| **EPIC-02** | Administración de convocatorias | 3 |
| **EPIC-03** | Registro de estudiantes y solicitudes | 4 |
| **EPIC-04** | Evaluación y comités | 5 |
| **EPIC-05** | Resolución, adjudicación y consulta pública | 6 |
| **EPIC-06** | Reportes y estadísticas | 7 |

---

## Avance por sprint

El sprint indicado en cada historia es aquel en que fue planificada y dada por terminada conforme
al cronograma del Acta de Constitución (§6, WBS). La columna de evidencia remite al Pull Request
en que la historia se integró a `develop`, de modo que cada fila puede comprobarse en el
repositorio.

### Velocidad por sprint

| Sprint | Período | Alcance | Puntos | Estado |
|---|---|---|---|---|
| 1 | 3 – 9 Sep | Constitución del equipo, repositorio y esqueleto técnico | 19 | Cerrado |
| 2 | 10 – 16 Sep | EPIC-01 · Cuentas y control de acceso | 13 | Cerrado |
| 3 | 17 – 23 Sep | EPIC-02 · Convocatorias | 16 | Cerrado |
| 4 | 24 – 30 Sep | EPIC-03 · Estudiantes y solicitudes | 34 | Cerrado |
| 5 | 1 – 7 Oct | EPIC-04 · Evaluación y comités | 37 | Cerrado |
| 6 | 8 – 14 Oct | EPIC-05 · Resolución y consulta pública | 18 | Cerrado |
| 7 | 15 – 21 Oct | EPIC-06 · Reportes y bitácora de auditoría | 34 | Cerrado |
| 8 | 22 – 31 Oct | Requerimientos del Product Owner y cierre | 24 | En curso |
| | | **Total completado** | **195** | |

Los 19 puntos del Sprint 1 corresponden a las tareas S1-01 a S1-12 del Sprint Backlog; los demás
sprints cuentan historias de usuario. La velocidad media resulta de 24 puntos por sprint, frente a
los 22 estimados al cerrar el backlog inicial.

### Sprint 2 · EPIC-01 — Cuentas y control de acceso

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-001 Registro de estudiante | 5 | Terminada, verificada en Staging | PR #16 | Los cinco criterios implementados y probados, incluido el inicio de sesión automático |
| US-002 Inicio de sesión | 3 | Terminada, verificada en Staging | PR #2, PR #13 | Token de 8 horas y bloqueo de la cuenta tras cinco intentos fallidos |
| US-003 Control de acceso por rol | 5 | Terminada, verificada en Staging | PR #4 | Guard global seguro por defecto, cuatro roles, respuesta 403 cubierta con pruebas de integración |
| US-004 Gestión de perfil | 3 | No priorizada | — | Prioridad Media; el alcance se declara cerrado en el Sprint 8 |
| US-005 Recuperación de contraseña | 5 | Sustituida por US-035 | — | US-035 cubre el caso con un alcance más amplio |

### Sprint 3 · EPIC-02 — Convocatorias

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-006 Crear convocatoria | 8 | Terminada, verificada en Staging | PR #14 | Implementada con el patrón Factory Method |
| US-007 Publicar convocatoria | 3 | Terminada, verificada en Staging | PR #14 | Una convocatoria publicada no admite cambios en requisitos ni cupos |
| US-008 Listado público de convocatorias | 5 | Terminada, verificada en Staging | PR #14 | Accesible sin cuenta, con requisitos y documentos exigidos |
| US-009 Cerrar convocatoria | 3 | No priorizada | — | Prioridad Media |
| US-010 Editar convocatoria en borrador | 3 | No priorizada | — | Prioridad Media |

### Sprint 4 · EPIC-03 — Estudiantes y solicitudes

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-011 Completar perfil académico | 5 | Terminada, verificada en Staging | PR #17 | Se guarda por partes e indica qué datos faltan. El departamento es un catálogo cerrado, requisito del reporte por región |
| US-012 Crear solicitud | 8 | Terminada, verificada en Staging | PR #17 | Implementada con el patrón State. Número correlativo `SOL-AAAA-NNNNNN` |
| US-013 Cargar documentación | 8 | Terminada, verificada en Staging | PR #17 | Formato comprobado por contenido y no por extensión. Almacenamiento mediante el patrón Adapter |
| US-014 Enviar solicitud | 5 | Terminada, verificada en Staging | PR #17 | Un único mensaje reúne todo lo que falta por completar |
| US-015 Ver mis solicitudes | 3 | Terminada, verificada en Staging | PR #17 | El expediente de otro estudiante devuelve 403 |
| US-016 Historial de la solicitud | 5 | Terminada, verificada en Staging | PR #17 | Cada transición registra fecha, autor y motivo; la tabla solo admite inserciones |

### Sprint 5 · EPIC-04 — Evaluación y comités

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-017 Crear comité evaluador | 5 | Terminada, verificada en Staging | PR #18, PR #24 | Un comité por convocatoria, mínimo un evaluador y sin integrantes repetidos. Incluye la creación de cuentas de evaluador. Quitar un integrante con solicitudes pendientes exige confirmación y las libera para reasignación |
| US-018 Asignar solicitudes | 8 | Terminada, verificada en Staging | PR #18 | Asignación manual y reparto automático equitativo que respeta la carga previa |
| US-019 Evaluar una solicitud | 13 | Terminada, verificada en Staging | PR #18 | Implementada con el patrón Strategy. El puntaje lo calcula el sistema; las fórmulas están pendientes de confirmación por el Product Owner |
| US-020 Ver mis solicitudes asignadas | 3 | Terminada, verificada en Staging | PR #18 | Solo las propias, con las pendientes primero |
| US-021 Consolidar dictámenes | 8 | Terminada, verificada en Staging | PR #18 | Puntaje promedio, ranking y referencia de cupos disponibles |
| US-022 Notificación por correo | 5 | No priorizada | — | US-034 cubre el aviso dentro del sistema; el canal de correo queda abierto |

### Sprint 6 · EPIC-05 — Resolución y consulta pública

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-023 Aprobar o rechazar | 8 | Terminada, verificada en Staging | PR #19 | Implementada con el patrón Facade. El cupo se comprueba de forma atómica, verificado con tres aprobaciones simultáneas por el último cupo |
| US-024 Adjudicar beca | 5 | Terminada, verificada en Staging | PR #19 | Beca con código `BECA-AAAA-NNNNNN`, registrada en la misma transacción que el cambio de estado |
| US-025 Consulta pública del estado | 5 | Terminada, verificada en Staging | PR #19 | Número de solicitud y CUI por POST, solo estado y fecha, con límite de diez consultas por minuto |
| US-026 Acta de resolución | 8 | No priorizada | — | Prioridad Media |
| US-027 Publicación de resultados | 5 | No priorizada | — | Prioridad Baja |

### Sprint 7 · EPIC-06 — Reportes y auditoría

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-028 Reporte de solicitudes | 8 | Terminada, verificada en Staging | PR #20 | Implementada con el patrón Builder: filtros por convocatoria, estado, nivel, departamento y fechas, con agrupación y orden |
| US-029 Panel de estadísticas | 8 | Terminada, verificada en Staging | PR #20 | Solicitudes recibidas, tasa de aprobación, cupos disponibles y días promedio de resolución |
| US-030 Exportar reporte | 5 | Terminada, verificada en Staging | PR #20 | CSV en UTF-8 con BOM, protegido contra inyección de fórmulas, y PDF generado sin dependencias externas |
| US-031 Becas por región | 5 | Terminada, verificada en Staging | PR #20 | Los 22 departamentos, incluidos los que no registran becas |
| US-032 Bitácora de auditoría | 8 | Terminada, verificada en Staging | PR #26 | Requerimiento del Product Owner del 17 de octubre. Registra autor, recurso, operación, resultado y fecha, incluidas las peticiones rechazadas |

### Sprint 8 · Requerimientos del Product Owner y cierre

| Historia | Pts | Estado | Evidencia | Nota |
|---|---|---|---|---|
| US-033 Segunda aprobación sobre Q10,000 | 8 | Terminada, verificada en Staging | PR #27, PR #34 | Requerimiento del Product Owner del 17 de octubre. La primera aprobación deja la solicitud en `APROBACION_PENDIENTE` sin reservar cupo; la segunda la confirma una persona distinta |
| US-034 Avisos al estudiante | 5 | Terminada, verificada en Staging | PR #27 | Requerimiento del Product Owner del 17 de octubre. Implementada con el patrón Observer |
| US-035 Recuperar la contraseña | 8 | Terminada, pendiente de verificar en Staging | PR #34 | Propuesta por el equipo el 24 de octubre tras revisar las prácticas de almacenamiento de contraseñas |
| US-036 Ver los documentos sin descargarlos | 3 | Terminada, pendiente de verificar en Staging | — | Propuesta por el equipo el 28 de octubre. El evaluador revisa los adjuntos en la misma pantalla donde redacta el dictamen |

---

## EPIC-01 · Gestión de cuentas y control de acceso

### US-001 — Registro de estudiante
**Como** estudiante aspirante, **quiero** crear una cuenta con mi correo y mi CUI **para poder**
postular a las convocatorias disponibles.

**Criterios de aceptación**
- El CUI debe tener 13 dígitos y ser único en el sistema.
- La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un número.
- La contraseña se almacena con hash (bcrypt), nunca en texto plano.
- Si el correo o el CUI ya existen, se muestra un mensaje de error claro y específico.
- Tras el registro exitoso, el usuario queda autenticado y es redirigido a su panel.

**Prioridad:** Alta · **Estimación:** 5

### US-002 — Inicio de sesión
**Como** usuario registrado, **quiero** iniciar sesión con mi correo y contraseña **para poder**
acceder a las funciones de mi rol.

**Criterios de aceptación**
- Credenciales válidas devuelven un token JWT con vigencia de 8 horas.
- Credenciales inválidas muestran un mensaje genérico ("correo o contraseña incorrectos"), sin
  revelar cuál de los dos falló.
- Tras 5 intentos fallidos consecutivos, la cuenta se bloquea 15 minutos.

**Prioridad:** Alta · **Estimación:** 3

### US-003 — Control de acceso por rol
**Como** sistema, **quiero** restringir cada operación según el rol del usuario **para poder**
garantizar que nadie acceda a información que no le corresponde.

**Criterios de aceptación**
- Roles definidos: `ESTUDIANTE`, `EVALUADOR`, `ADMINISTRADOR`, `PUBLICO`.
- Un evaluador solo ve las solicitudes que le fueron asignadas.
- Un estudiante solo ve sus propias solicitudes.
- Un acceso no autorizado devuelve HTTP 403, no 404 ni el recurso.

**Prioridad:** Alta · **Estimación:** 5

### US-004 — Gestión de perfil
**Como** usuario autenticado, **quiero** ver y editar mis datos personales **para poder**
mantener mi información actualizada.
**Prioridad:** Media · **Estimación:** 3

### US-005 — Recuperación de contraseña
**Como** usuario que olvidó su contraseña, **quiero** restablecerla mediante un enlace enviado a
mi correo **para poder** recuperar el acceso a mi cuenta.
**Prioridad:** Baja · **Estimación:** 5

---

## EPIC-02 · Administración de convocatorias

### US-006 — Crear convocatoria
**Como** administrador del Ministerio, **quiero** crear una convocatoria indicando su tipo,
requisitos, documentos exigidos, cupos y fechas **para poder** abrir un proceso de becas.

**Criterios de aceptación**
- Tipos soportados: `NIVEL_MEDIO`, `UNIVERSITARIA`, `POSGRADO`. Cada tipo trae por defecto sus
  requisitos y documentos exigidos.
- La fecha de cierre debe ser posterior a la de apertura.
- El número de cupos debe ser un entero mayor que cero.
- Una convocatoria recién creada queda en estado `BORRADOR` y no es visible al público.

> 🔧 **Aquí se implementa el patrón Factory Method** (`ConvocatoriaFactory`): cada tipo de
> convocatoria se construye con sus reglas propias sin condicionales dispersos.

**Prioridad:** Alta · **Estimación:** 8

### US-007 — Publicar convocatoria
**Como** administrador, **quiero** publicar una convocatoria en `BORRADOR` **para poder** que los
estudiantes empiecen a postular.

**Criterios de aceptación**
- Solo se publica si tiene al menos un requisito y un documento exigido definidos.
- Al publicar pasa a estado `PUBLICADA` y aparece en el listado público.
- Una convocatoria publicada ya no permite editar sus requisitos ni sus cupos.

**Prioridad:** Alta · **Estimación:** 3

### US-008 — Listado público de convocatorias
**Como** visitante, **quiero** ver las convocatorias vigentes con sus requisitos y fechas **para
poder** decidir a cuál postular, sin necesidad de tener cuenta.

**Criterios de aceptación**
- Se listan solo las convocatorias en estado `PUBLICADA` cuya fecha de cierre no ha pasado.
- Se puede filtrar por tipo de beca.
- La vista funciona correctamente en pantalla de móvil.

**Prioridad:** Alta · **Estimación:** 5

### US-009 — Cerrar convocatoria
**Como** administrador, **quiero** cerrar una convocatoria **para poder** impedir nuevas
solicitudes y comenzar la etapa de evaluación.
**Prioridad:** Media · **Estimación:** 3

### US-010 — Editar convocatoria en borrador
**Como** administrador, **quiero** modificar una convocatoria que aún no he publicado **para
poder** corregir errores antes de que sea visible.
**Prioridad:** Media · **Estimación:** 3

---

## EPIC-03 · Registro de estudiantes y solicitudes

### US-011 — Completar perfil académico
**Como** estudiante, **quiero** registrar mis datos académicos y socioeconómicos **para poder**
que se evalúe mi elegibilidad.

**Criterios de aceptación**
- Campos: centro educativo, nivel actual, promedio, ingreso familiar mensual, número de
  dependientes, departamento y municipio de residencia.
- El promedio debe estar entre 0 y 100.
- El perfil debe estar completo antes de poder enviar una solicitud.

**Prioridad:** Alta · **Estimación:** 5

### US-012 — Crear solicitud
**Como** estudiante con perfil completo, **quiero** iniciar una solicitud a una convocatoria
abierta **para poder** postular a la beca.

**Criterios de aceptación**
- Solo se puede postular a convocatorias en estado `PUBLICADA` y dentro del plazo.
- No se permite más de una solicitud activa por estudiante y convocatoria.
- La solicitud nace en estado `BORRADOR` y recibe un número correlativo único.
- El sistema muestra la lista de documentos que faltan por cargar.

> 🔧 **Aquí se implementa el patrón State** (`EstadoSolicitud`): el ciclo de vida es
> `BORRADOR → ENVIADA → EN_EVALUACION → APROBADA | RECHAZADA → ADJUDICADA`. Cada estado decide
> qué transiciones son válidas.

**Prioridad:** Alta · **Estimación:** 8

### US-013 — Cargar documentación
**Como** estudiante, **quiero** subir los documentos exigidos por la convocatoria **para poder**
completar mi solicitud.

**Criterios de aceptación**
- Formatos permitidos: PDF, JPG, PNG. Tamaño máximo 5 MB por archivo.
- Un archivo con formato o tamaño inválido se rechaza con un mensaje específico.
- Se puede reemplazar un documento mientras la solicitud esté en `BORRADOR`.
- Cada documento queda asociado al requisito que satisface.

> 🔧 **Aquí se implementa el patrón Adapter** (`AlmacenamientoDocumentos`): almacenamiento
> en disco local y un adaptador en memoria para las pruebas, sin que el dominio se entere. Uno de
> nube sería una clase más; no se construyó.

**Prioridad:** Alta · **Estimación:** 8

### US-014 — Enviar solicitud
**Como** estudiante, **quiero** enviar formalmente mi solicitud **para poder** que entre a
evaluación.

**Criterios de aceptación**
- Solo se envía si todos los documentos exigidos están cargados y el perfil está completo.
- Si falta algo, el sistema indica exactamente qué falta y no permite el envío.
- Al enviarse, la solicitud pasa a `ENVIADA`, se registra la fecha y hora, y ya no es editable.
- El estudiante recibe una notificación de confirmación con su número de solicitud.

**Prioridad:** Alta · **Estimación:** 5

### US-015 — Ver mis solicitudes
**Como** estudiante, **quiero** ver el listado y el estado de todas mis solicitudes **para poder**
darles seguimiento.
**Prioridad:** Alta · **Estimación:** 3

### US-016 — Historial de la solicitud
**Como** estudiante, **quiero** ver la línea de tiempo de los cambios de estado de mi solicitud
**para poder** entender en qué etapa está y desde cuándo.
**Prioridad:** Media · **Estimación:** 5

---

## EPIC-04 · Evaluación y comités

### US-017 — Crear comité evaluador
**Como** administrador, **quiero** conformar un comité asignándole evaluadores y una convocatoria
**para poder** distribuir el trabajo de evaluación.
**Prioridad:** Alta · **Estimación:** 5

### US-018 — Asignar solicitudes a evaluadores
**Como** administrador, **quiero** repartir las solicitudes recibidas entre los miembros del
comité **para poder** que cada una sea revisada.

**Criterios de aceptación**
- Solo se asignan solicitudes en estado `ENVIADA`.
- Cada solicitud se asigna al menos a un evaluador.
- Al asignarse, la solicitud pasa a `EN_EVALUACION`.
- Se ofrece una opción de reparto automático equitativo entre los miembros del comité.

**Prioridad:** Alta · **Estimación:** 8

### US-019 — Evaluar una solicitud
**Como** evaluador, **quiero** revisar una solicitud y su documentación y asignarle un puntaje
según la rúbrica **para poder** emitir mi dictamen.

**Criterios de aceptación**
- El evaluador ve los datos del solicitante y puede abrir cada documento cargado.
- El puntaje se calcula con el criterio correspondiente al tipo de beca.
- El evaluador debe escribir una observación justificando su dictamen.
- Una vez emitido, el dictamen no se puede modificar; queda registrado con fecha y autor.

> 🔧 **Aquí se implementa el patrón Strategy** (`CriterioEvaluacionStrategy`): `MeritoAcademico`,
> `NecesidadSocioeconomica` y `Mixto` son algoritmos intercambiables de puntuación. Agregar una
> nueva política de becas = agregar una estrategia, sin tocar el código existente.

**Prioridad:** Alta · **Estimación:** 13

### US-020 — Ver mis solicitudes asignadas
**Como** evaluador, **quiero** ver únicamente las solicitudes que me corresponden y cuáles ya
evalué **para poder** organizar mi trabajo.
**Prioridad:** Alta · **Estimación:** 3

### US-021 — Consolidar dictámenes del comité
**Como** administrador, **quiero** ver el puntaje consolidado de cada solicitud y el ranking de
la convocatoria **para poder** decidir a quiénes se les adjudica.
**Prioridad:** Media · **Estimación:** 8

### US-022 — Notificación de cambio de estado
**Como** estudiante, **quiero** recibir una notificación cuando cambie el estado de mi solicitud
**para poder** enterarme sin tener que revisar el sistema constantemente.

> 🔧 Candidato para el patrón Observer (extra, no obligatorio).

**Prioridad:** Media · **Estimación:** 5

---

## EPIC-05 · Resolución, adjudicación y consulta pública

### US-023 — Aprobar o rechazar solicitud
**Como** administrador, **quiero** resolver una solicitud evaluada indicando el motivo **para
poder** cerrar formalmente su proceso.

**Criterios de aceptación**
- Solo se resuelven solicitudes con al menos un dictamen registrado.
- El motivo es obligatorio en ambos casos, aprobación y rechazo.
- La solicitud pasa a `APROBADA` o `RECHAZADA`; la transición queda registrada con autor y fecha.
- No se puede aprobar por encima de los cupos disponibles de la convocatoria.

> 🔧 **Aquí se implementa el patrón Facade** (`ResolucionFacade`): la resolución coordina
> dictámenes, cupos, cambio de estado y aviso en una sola operación expuesta al controlador. El
> acta quedó para US-026 y no se implementó.

**Prioridad:** Alta · **Estimación:** 8

### US-024 — Adjudicar beca
**Como** administrador, **quiero** adjudicar formalmente la beca a una solicitud aprobada **para
poder** dejar constancia del otorgamiento y descontar el cupo.
**Prioridad:** Alta · **Estimación:** 5

### US-025 — Consulta pública del estado
**Como** cualquier persona, **quiero** consultar el estado de una solicitud con su número y el
CUI del solicitante **para poder** darle seguimiento sin tener cuenta en el sistema.

**Criterios de aceptación**
- No requiere autenticación.
- Se muestran únicamente el estado actual y la fecha del último cambio, nunca datos
  personales, documentos ni puntajes.
- Si la combinación número + CUI no coincide, se muestra un mensaje genérico sin revelar si el
  número existe.

**Prioridad:** Alta · **Estimación:** 5

### US-026 — Acta de resolución
**Como** administrador, **quiero** generar el acta de resolución de una convocatoria **para
poder** respaldar la decisión ante una auditoría.
**Prioridad:** Media · **Estimación:** 8

### US-027 — Publicación de resultados
**Como** visitante, **quiero** ver el listado público de becas adjudicadas por convocatoria
**para poder** verificar la transparencia del proceso.
**Prioridad:** Baja · **Estimación:** 5

---

## EPIC-06 · Reportes y estadísticas

### US-028 — Reporte de solicitudes por convocatoria
**Como** administrador, **quiero** generar un reporte de solicitudes recibidas filtrado por
convocatoria, estado, nivel y rango de fechas **para poder** rendir cuentas.

> 🔧 **Aquí se implementa el patrón Builder** (`ReporteBuilder`): la construcción del reporte con
> sus múltiples filtros opcionales, agrupaciones y formato de salida se hace paso a paso, sin
> constructores telescópicos.

**Prioridad:** Alta · **Estimación:** 8

### US-029 — Panel de estadísticas
**Como** administrador, **quiero** ver un panel con indicadores clave —solicitudes recibidas,
tasa de aprobación, cupos disponibles, tiempo promedio de resolución— **para poder** monitorear
la gestión.
**Prioridad:** Media · **Estimación:** 8

### US-030 — Exportar reporte
**Como** administrador, **quiero** exportar cualquier reporte a PDF o CSV **para poder**
compartirlo fuera del sistema.
**Prioridad:** Media · **Estimación:** 5

### US-031 — Reporte de becas adjudicadas por región
**Como** administrador, **quiero** ver la distribución geográfica de las becas adjudicadas **para
poder** evaluar la equidad territorial de los programas.
**Prioridad:** Baja · **Estimación:** 5

---

## 5. Requisitos No Funcionales (NFR)

### Rendimiento
- Cualquier pantalla debe cargar en menos de 3 segundos con conexión 3G.
- El listado público de convocatorias debe responder en menos de 1 segundo.
- El sistema debe soportar 100 usuarios concurrentes sin degradación perceptible.
- Las consultas paginadas devuelven máximo 50 registros por página.

### Seguridad
- Las contraseñas se almacenan con hash bcrypt (mínimo 10 rondas). Nunca en texto plano ni
  con cifrado reversible.
- Toda la comunicación viaja sobre HTTPS.
- El sistema debe ser inmune a inyección SQL: se usa exclusivamente el ORM con consultas
  parametrizadas.
- Toda entrada de usuario se valida en el servidor, no solo en el navegador.
- Los documentos cargados no son accesibles por URL directa sin autorización.
- Ninguna credencial ni cadena de conexión se versiona en el repositorio.

### Usabilidad
- Un estudiante debe poder consultar el estado de su beca en máximo 3 clics desde la página
  principal.
- Todo mensaje de error debe indicar qué hacer para corregirlo, no solo que algo falló.
- La interfaz está completamente en español.
- Formularios largos muestran el progreso y permiten guardar como borrador.

### Compatibilidad
- Funcional en las últimas versiones de Chrome, Firefox y Edge.
- Diseño responsivo: usable desde 360 px de ancho (móvil) hasta escritorio.

### Disponibilidad
- Disponibilidad objetivo del 99% durante los períodos de convocatoria abierta.
- Respaldo diario automático de la base de datos.

### Mantenibilidad
- Cobertura de pruebas unitarias de al menos 60% en las capas de dominio y aplicación.
- Todo método público lleva comentario con propósito, parámetros y valor de retorno.
- El código pasa el linter sin advertencias antes de poder integrarse.

### Trazabilidad
- Todo cambio de estado de una solicitud registra quién, cuándo y por qué.
- Los registros de auditoría no se pueden modificar ni eliminar desde la aplicación.

---

## 6. Definición de "Hecho" (Definition of Done)

Acuerdo del equipo. Se aplica a cada historia de usuario, sin excepciones. Si un punto no se
cumple, la historia no está hecha y regresa al backlog.

- [ ] El código está integrado a `develop` mediante un Pull Request aprobado
- [ ] Se escribieron pruebas unitarias para la lógica de negocio y todas pasan
- [ ] El código fue revisado y aprobado por al menos otro integrante (code review)
- [ ] Se cumplen todos los criterios de aceptación de la historia
- [ ] La suite de regresión completa está en verde: no se introdujeron bugs nuevos
- [ ] El linter pasa sin advertencias
- [ ] La documentación técnica afectada fue creada o actualizada
- [ ] La funcionalidad está desplegada en Staging
- [ ] El Proxy Product Owner (Stuard) verificó los criterios de aceptación y movió la tarjeta
      a *Done* en el tablero

> **Nota del Scrum Master:** los dos últimos puntos son los que más se olvidan. Sin despliegue en
> Staging y sin el visto bueno del Proxy PO, una historia sigue estando "en progreso" por más
> terminada que se sienta.

### La aceptación tiene dos niveles

| Nivel | Quién | Cuándo | Qué significa |
|---|---|---|---|
| **Verificación** | Stuard, Proxy PO | Al terminar la historia | Los criterios de aceptación escritos se cumplen. La tarjeta pasa a *Done* |
| **Aceptación formal** | Ing. Fuentes, PO | En la Sprint Review | La funcionalidad aporta el valor esperado. Se registra en la minuta |

El Proxy Product Owner solo verifica contra los criterios ya escritos: no inventa requisitos,
no cambia prioridades y no aprueba desviaciones de alcance. Si surge una duda que los criterios
no resuelven, se escala al Product Owner y queda anotada para la Sprint Review.

Que el Product Owner rechace en la Review algo que el Proxy ya había dado por bueno **no es un
fallo del proceso**: significa que los criterios de aceptación estaban incompletos. En ese caso se
corrigen los criterios de la historia, no se culpa a nadie, y es material para la Retrospectiva.

---

## Requerimientos incorporados después del backlog inicial

> Estas cinco historias no estaban en el backlog de la versión 1.0. Se documentan aquí, con
> el mismo formato que las demás, porque un requerimiento que entra tarde sigue siendo un
> requerimiento: lo que cambia es cuándo se estimó, no cómo se trata.
>
> **No todas vinieron del mismo sitio, y la diferencia importa.** US-032, US-033 y US-034 las pidió
> el Product Owner en la clase del 17 de octubre de 2026, cuando las 24 historias planificadas
> ya estaban terminadas y verificadas en Staging. US-035 la propuso el equipo el 24 de octubre,
> al contrastar el sistema con las buenas prácticas de seguridad vistas en clase. Una la impone el
> cliente; la otra sale de mirarse el producto con criterio propio.
>
> El análisis de qué costó incorporarlas está en
> [`23-analisis-impacto-requerimientos-po.md`](23-analisis-impacto-requerimientos-po.md).

### US-032 — Bitácora de auditoría
**Como** administrador del sistema, **quiero** que toda acción que modifique datos quede
registrada **para poder** auditar quién hizo qué, cuándo y con qué resultado.

**Criterios de aceptación**
- Se registra el autor, su rol, la operación, el recurso afectado, el resultado y la fecha.
- Se registran también las acciones rechazadas (401, 403, 409, 422): son las que más interesan.
- Las consultas de solo lectura no se registran.
- Ningún asiento puede modificarse ni borrarse desde la aplicación.
- La bitácora no guarda el cuerpo de las peticiones: por ahí viajan el CUI y las contraseñas.
- Pantalla de consulta para administración, con filtros por fecha, actor, recurso y rechazadas.

> 🔧 Se implementa con un middleware global y no con un interceptor. En NestJS los *guards*
> corren antes que los interceptores, de modo que un interceptor nunca vería un 403 —justo el caso
> que más importa auditar. Queda escrito como ADR-09 en `05-arquitectura.md`.

**Prioridad:** Alta · **Estimación:** 8

### US-033 — Segunda aprobación para becas de monto alto
**Como** Product Owner, **quiero** que las solicitudes cuya beca supere los Q10,000 necesiten una
segunda aprobación **para poder** evitar que una sola persona comprometa montos elevados.

**Criterios de aceptación**
- La convocatoria define el monto de la beca; el monto queda fijado en la solicitud al crearla.
- Si el monto supera Q10,000, la primera aprobación deja la solicitud en
  `APROBACION_PENDIENTE` y no reserva cupo todavía.
- La segunda aprobación debe darla una persona distinta de la que dio la primera.
- Confirmar la segunda aprobación pasa la solicitud a `APROBADA` y ahí sí reserva el cupo.
- Desde `APROBACION_PENDIENTE` todavía se puede rechazar, con su motivo.
- Por debajo del umbral el flujo no cambia: una sola aprobación.

> 🔧 **Reutiliza el patrón State**: `APROBACION_PENDIENTE` es una clase de estado más
> (`EstadoAprobacionPendiente`), no un `if` dentro del caso de uso. Esta historia es la prueba de
> que la decisión de diseño del Sprint 4 valió la pena: el estado nuevo no obligó a tocar los
> estados existentes.

**Prioridad:** Alta · **Estimación:** 8

### US-034 — Avisos al estudiante por cambio de estado
**Como** estudiante, **quiero** recibir un aviso cada vez que mi solicitud cambia de estado
**para poder** enterarme sin tener que entrar a revisar todos los días.

**Criterios de aceptación**
- Cada cambio de estado genera un aviso dirigido al estudiante dueño de la solicitud.
- El aviso dice a qué estado pasó y, cuando lo hay, el motivo de la resolución.
- El estudiante ve sus avisos en una pantalla propia, con los no leídos marcados.
- Puede marcar uno como leído o marcarlos todos.
- Un estudiante no puede marcar ni ver los avisos de otro.
- Crear la solicitud no genera aviso: el estado inicial no es un *cambio* de estado.
- Si el aviso falla al guardarse, la operación del usuario no se cae: ya ocurrió y es válida.

> 🔧 **Aquí se implementa el patrón Observer** (séptimo patrón del proyecto). La solicitud acumula
> lo que le pasó y el caso de uso lo publica después de persistir, para que nunca se avise de
> algo que no llegó a guardarse. Justificado en `06-patrones.md`, sección 7.

**Prioridad:** Alta · **Estimación:** 5

---

### US-035 — Recuperar la contraseña olvidada

**Como** usuario de la plataforma, **quiero** recuperar mi contraseña por correo cuando la olvide
**para poder** volver a entrar sin depender de que un administrador me la cambie a mano.

> **De dónde salió esta historia.** No la pidió el Product Owner. El 24 de octubre, al contrastar
> el sistema con las buenas prácticas de almacenamiento de contraseñas vistas en clase, se vio que
> de las cinco el proyecto cumplía tres —biblioteca confiable, nada de MD5 ni SHA-1, y ninguna
> contraseña en los logs— y le faltaban dos: la recuperación y el doble factor.
>
> **Se decidió hacer la recuperación y no el doble factor.** El segundo es bastante más trabajo del
> que cabía en los días restantes, y la propia diapositiva lo plantea como "cuando sea posible".
> Queda anotado como ítem no implementado, para que conste que se identificó y se descartó con un
> motivo, no que se pasó por alto.

**Criterios de aceptación**

- Desde la pantalla de acceso se puede pedir un enlace de recuperación escribiendo el correo.
- El sistema responde exactamente igual exista o no una cuenta con ese correo, y solo envía el
  mensaje si existe.
- El enlace llega por correo y permite elegir una contraseña nueva, que debe cumplir la misma
  política que el registro.
- El enlace vence en una hora y sirve una sola vez.
- Al usar uno, los demás enlaces vigentes de esa persona dejan de servir.
- Un enlace inexistente, uno vencido y uno ya usado producen el mismo mensaje de error.
- Al restablecer la contraseña, la cuenta queda desbloqueada.
- Restablecerla no inicia sesión: la persona vuelve al acceso y escribe la contraseña nueva.
- Se limita a cinco intentos cada quince minutos por dirección.

> 🔒 **Por qué la respuesta es idéntica exista o no la cuenta.** Es el criterio con más peso de toda
> la historia. Si el sistema contestara "no existe esa dirección", cualquiera podría ir probando
> correos y quedarse con la lista de quién está registrado. En un sistema de becas eso revela
> **quién pidió ayuda económica al Estado**, que es justo el tipo de dato que la plataforma existe
> para proteger. Hay una prueba que compara las dos respuestas carácter por carácter.

> 🔧 **Aquí se vuelve a usar el patrón Adapter.** Enviar correo de verdad necesita credenciales de
> un servidor SMTP que un entorno de pruebas no tiene. Con un puerto `EnviadorCorreo` y dos
> adaptadores —consola y SMTP— el flujo completo se puede recorrer y demostrar sin ellas: el
> adaptador por defecto escribe el mensaje en el log. Se cambia con la variable `CORREO_TIPO` y
> ninguna regla de negocio se entera.

> ⚠️ **Limitación conocida.** El adaptador SMTP **no está verificado contra un servidor de correo
> real**. Funciona contra un servidor de prueba que imita a Gmail, pero eso no es lo mismo.
> Mientras no se compruebe, el adaptador en uso es el de consola y el enlace aparece en el log del
> servidor, no en el buzón de la persona.

**Prioridad:** Media · **Estimación:** 8

---

### US-036 — Ver los documentos sin descargarlos

**Como** evaluador, **quiero** ver los documentos adjuntos dentro de la pantalla del dictamen
**para poder** comprobar los datos del solicitante mientras redacto mi observación.

> **De dónde salió esta historia.** Tampoco la pidió el Product Owner. Al repasar el flujo de
> evaluación se vio que nada empuja al evaluador a abrir los documentos: puede ver que existen,
> escribir los veinte caracteres de observación que exige el sistema y emitir el dictamen sin
> haber mirado el certificado de notas.
>
> **Se descartó pedirle una confirmación.** La alternativa era una casilla del tipo "confirmo que
> revisé los documentos", validada en el servidor como ya se hace al quitar a alguien de un comité.
> Se rechazó porque una casilla se marca sin leer: añade una declaración, no una revisión. Poner el
> documento delante del evaluador, en la misma pantalla donde escribe, cambia lo que hace; la
> casilla solo cambia lo que firma.

**Criterios de aceptación**

- En la pantalla del dictamen, cada documento cargado ofrece **Ver** junto a su nombre y tamaño.
- Al pulsarlo, el documento se muestra **dentro de la página**, sin descargarlo ni abrir otra
  pestaña.
- Se muestran PDF e imágenes. Cualquier otro formato avisa de que debe descargarse.
- El documento abierto queda **señalado en la lista**, y se cierra con **Ocultar** o con **Cerrar**.
- Sigue existiendo **Descargar**, para quien prefiera el archivo.
- El visor **no abre una URL pública**: el archivo se pide con la sesión, igual que antes.

> 🔒 **Por qué esto no abre un agujero.** El documento sigue viajando por la misma ruta protegida:
> se pide con el token y el servidor comprueba que la solicitud esté asignada a ese evaluador. Lo
> único que cambia es qué hace el navegador con el archivo una vez recibido. Un evaluador no puede
> ver con el visor nada que no pudiera descargar antes.

**Prioridad:** Media · **Estimación:** 3

---

## Resumen de estimación inicial

| Epic | Historias | Puntos |
|---|---|---|
| EPIC-01 · Cuentas y acceso | 5 | 21 |
| EPIC-02 · Convocatorias | 5 | 22 |
| EPIC-03 · Estudiantes y solicitudes | 6 | 34 |
| EPIC-04 · Evaluación y comités | 6 | 42 |
| EPIC-05 · Resolución y consulta | 5 | 31 |
| EPIC-06 · Reportes | 4 | 26 |
| **Total** | **31** | **176** |

> **Actualización del 17 de octubre de 2026.** A estas 31 historias se sumaron **US-032, US-033 y
> US-034**, pedidas por el Product Owner cuando el backlog inicial ya estaba terminado: **34
> historias y 197 puntos**. Los 21 puntos nuevos equivalen a casi un sprint completo de la
> velocidad estimada, y se absorbieron sin mover la fecha de entrega porque el trabajo planificado
> se había adelantado. Esa holgura era el margen del proyecto, y se consumió aquí.
>
> **Actualización del 24 de octubre de 2026.** Se sumó US-035, propuesta por el equipo y no por
> el Product Owner: 35 historias y 205 puntos. Es la única historia del proyecto que no nació
> ni del backlog inicial ni de una petición del cliente, sino de revisar el producto contra un
> criterio externo. Se hizo cuando el margen ya estaba consumido, así que compite directamente con
> el cierre de la entrega; por eso se le puso prioridad Media y no Alta, y por eso el doble
> factor que surgió en el mismo análisis se descartó de forma explícita en lugar de dejarlo
> abierto.
>
> **Actualización del 28 de octubre de 2026.** Se sumó **US-036**, también propuesta por el equipo:
> **36 historias y 208 puntos**. Salió de revisar el flujo de evaluación y notar que nada obligaba
> al evaluador a abrir los documentos antes de dictaminar. Se descartó pedirle una casilla de
> confirmación —se marca sin leer— y se optó por mostrarle los documentos en la misma pantalla.

Con 8 sprints disponibles, se requiere una velocidad promedio de ~22 puntos por sprint. La
velocidad real se medirá a partir del Sprint 2; si resulta menor, el Product Owner despriorizará
las historias de prioridad Baja (US-005, US-027, US-031) antes que sacrificar calidad de diseño,
pruebas o documentación —que es lo que realmente se evalúa.
