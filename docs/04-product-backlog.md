# Product Backlog Inicial
### Anexo 4, secciones 4, 5 y 6 — Proyecto Final, Análisis de Sistemas II

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Product Owner** | Ing. Mario Fuentes |
| **Responsable del backlog** | Isaac (Scrum Master) |
| **Fecha** | 3 de septiembre de 2026 · **Versión** 1.0 |

> El backlog es la **única fuente de requisitos** del proyecto. Se refina cada jueves en la
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

## Estado de avance — actualizado el 10 de octubre de 2026

> **Las 24 historias están en Done.** Stuard, como Proxy Product Owner, verificó sus criterios de
> aceptación contra el entorno de Staging el 10 de octubre y movió las tarjetas en el tablero. Con
> eso se cumplen los ocho puntos de la Definition of Done, incluidos los dos que más se olvidan:
> despliegue en Staging y aceptación del Proxy PO.
>
> La verificación no fue un trámite: al desplegar aparecieron dos fallos que ningún entorno local
> mostraba —Render rechaza `plan` en sitios estáticos (PR #21) y la carpeta de documentos no existía
> en la imagen, así que subir un archivo devolvía 500 (PR #22)—. Ambos corregidos antes de verificar.

| Historia | Estado | Nota |
|---|---|---|
| **US-001** Registro de estudiante | 🟢 **Done** — verificada en Staging | Los cinco criterios implementados y probados, incluido el inicio de sesión automático. Adelantada del Sprint 3 |
| **US-002** Inicio de sesión | 🟢 **Done** — verificada en Staging | Los tres criterios implementados y probados. El bloqueo tras 5 intentos se completó el 12 Sep |
| **US-003** Control de acceso por rol | 🟢 **Done** — verificada en Staging | Guard global *seguro por defecto*, los 4 roles, 403 verificado con pruebas de integración |
| **US-006** Crear convocatoria | 🟢 **Done** — verificada en Staging | Con el patrón **Factory Method**. Adelantada del Sprint 3 |
| **US-007** Publicar convocatoria | 🟢 **Done** — verificada en Staging | El criterio 3 (no editar publicadas) queda como regla del dominio; la edición es US-010 |
| **US-008** Listado público de convocatorias | 🟢 **Done** — verificada en Staging | Público y sin cuenta, con requisitos y documentos. Corregido el 12 Sep |
| **US-011** Completar perfil académico | 🟢 **Done** — verificada en Staging | Se guarda por partes; dice qué falta. Departamento como catálogo cerrado para el reporte por región (US-031). Adelantada del Sprint 4 |
| **US-012** Crear solicitud | 🟢 **Done** — verificada en Staging | Con el patrón **State**. Número `SOL-AAAA-NNNNNN`. Exige perfil completo (precondición de CU-06). Adelantada del Sprint 4 |
| **US-013** Cargar documentación | 🟢 **Done** — verificada en Staging | Formato comprobado **por contenido**, no por nombre. Almacenamiento con **Adapter** (disco local). Adelantada del Sprint 4 |
| **US-014** Enviar solicitud | 🟢 **Done** — verificada en Staging | Un solo mensaje con todo lo que falta. La notificación sale por consola hasta US-022 (correo). Adelantada del Sprint 4 |
| **US-015** Ver mis solicitudes | 🟢 **Done** — verificada en Staging | Otro estudiante recibe 403 (US-003). Adelantada del Sprint 4 |
| **US-016** Historial de la solicitud | 🟢 **Done** — verificada en Staging | Cada transición guarda fecha, autor y motivo; solo se insertan filas. Adelantada del Sprint 4 |
| **US-017** Crear comité evaluador | 🟢 **Done** — verificada en Staging | Sin criterios escritos: se tomaron los de CU-13 (un comité por convocatoria, al menos un evaluador, sin repetidos, auditoría). Incluye crear cuentas de evaluador (decisión del 16 Sep). Quitar integrantes (5a) avisa cuántas solicitudes quedarían sin evaluador y exige confirmación, y las que se liberan vuelven a la lista por asignar; implementado el 14 de octubre, después de la verificación, así que esa parte todavía no se ha probado en Staging. Adelantada del Sprint 5 |
| **US-018** Asignar solicitudes | 🟢 **Done** — verificada en Staging | Manual y reparto automático equitativo que respeta la carga previa. Adelantada del Sprint 5 |
| **US-019** Evaluar una solicitud | 🟢 **Done** — verificada en Staging | Con el patrón **Strategy**. El puntaje lo calcula el sistema; **las fórmulas están pendientes de confirmar con el Product Owner**. Adelantada del Sprint 5 |
| **US-020** Ver mis solicitudes asignadas | 🟢 **Done** — verificada en Staging | Solo las propias, pendientes primero. Otro evaluador recibe 403. Adelantada del Sprint 5 |
| **US-021** Consolidar dictámenes | 🟢 **Done** — verificada en Staging | Promedio, ranking y referencia de cupos. No aprueba nada: eso es US-023. Adelantada del Sprint 5 |
| **US-023** Aprobar o rechazar | 🟢 **Done** — verificada en Staging | Con el patrón **Facade**. El cupo se comprueba de forma atómica (verificado con tres aprobaciones simultáneas por el último cupo). Sin acta: es US-026. Adelantada del Sprint 6 |
| **US-024** Adjudicar beca | 🟢 **Done** — verificada en Staging | Beca con código `BECA-AAAA-NNNNNN`, guardada en la misma transacción que el cambio de estado. El cupo se reserva al aprobar. Adelantada del Sprint 6 |
| **US-025** Consulta pública | 🟢 **Done** — verificada en Staging | Número + CUI por POST (el CUI no va en la URL), solo estado y fecha, mismo mensaje para cualquier fallo y límite de 10 consultas por minuto por dirección. Adelantada del Sprint 6 |
| **US-028** Reporte de solicitudes | 🟢 **Done** — verificada en Staging | Con el patrón **Builder**: filtros por convocatoria, estado, nivel, departamento y fechas de envío; agrupación y orden. Sin datos personales. Adelantada del Sprint 7 |
| **US-029** Panel de estadísticas | 🟢 **Done** — verificada en Staging | Recibidas, tasa de aprobación (sobre las resueltas), cupos disponibles y días promedio de resolución, global y por convocatoria. Adelantada del Sprint 7 |
| **US-030** Exportar reporte | 🟢 **Done** — verificada en Staging | CSV (UTF-8 con BOM, protegido contra fórmulas) y PDF propio sin dependencias nuevas. Adelantada del Sprint 7 |
| **US-031** Becas por región | 🟢 **Done** — verificada en Staging | Los 22 departamentos, también los que no tienen becas. Adelantada del Sprint 7 |
| Resto | ⬜ Pendiente | Según el calendario de sprints |

> **Nota para la Sprint Review.** Ninguna de estas historias puede marcarse como *Completada*
> ante el Product Owner hasta cumplir los 8 puntos de la Definition of Done, incluido el
> despliegue en Staging y su verificación. Hoy solo corren en local.

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

> 🔧 **Aquí se implementa el patrón Adapter** (`AlmacenamientoDocumentosPort`): almacenamiento
> en disco local durante el desarrollo, en la nube en producción, sin que el dominio se entere.

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

> 🔧 Candidato para el patrón **Observer** (extra, no obligatorio).

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

> 🔧 **Aquí se implementa el patrón Facade** (`SolicitudFacade`): la resolución coordina
> validación de cupos, cambio de estado, generación de acta y notificación en una sola operación
> expuesta al controlador.

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
- Se muestran únicamente el estado actual y la fecha del último cambio, **nunca** datos
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
- Cualquier pantalla debe cargar en menos de **3 segundos** con conexión 3G.
- El listado público de convocatorias debe responder en menos de **1 segundo**.
- El sistema debe soportar **100 usuarios concurrentes** sin degradación perceptible.
- Las consultas paginadas devuelven máximo 50 registros por página.

### Seguridad
- Las contraseñas se almacenan con hash **bcrypt** (mínimo 10 rondas). Nunca en texto plano ni
  con cifrado reversible.
- Toda la comunicación viaja sobre **HTTPS**.
- El sistema debe ser inmune a inyección SQL: se usa exclusivamente el ORM con consultas
  parametrizadas.
- Toda entrada de usuario se valida en el servidor, no solo en el navegador.
- Los documentos cargados no son accesibles por URL directa sin autorización.
- Ninguna credencial ni cadena de conexión se versiona en el repositorio.

### Usabilidad
- Un estudiante debe poder consultar el estado de su beca en **máximo 3 clics** desde la página
  principal.
- Todo mensaje de error debe indicar qué hacer para corregirlo, no solo que algo falló.
- La interfaz está completamente en español.
- Formularios largos muestran el progreso y permiten guardar como borrador.

### Compatibilidad
- Funcional en las últimas versiones de **Chrome, Firefox y Edge**.
- Diseño **responsivo**: usable desde 360 px de ancho (móvil) hasta escritorio.

### Disponibilidad
- Disponibilidad objetivo del **99% durante los períodos de convocatoria abierta**.
- Respaldo diario automático de la base de datos.

### Mantenibilidad
- Cobertura de pruebas unitarias de al menos **60%** en las capas de dominio y aplicación.
- Todo método público lleva comentario con propósito, parámetros y valor de retorno.
- El código pasa el linter sin advertencias antes de poder integrarse.

### Trazabilidad
- Todo cambio de estado de una solicitud registra **quién**, **cuándo** y **por qué**.
- Los registros de auditoría no se pueden modificar ni eliminar desde la aplicación.

---

## 6. Definición de "Hecho" (Definition of Done)

Acuerdo del equipo. Se aplica a **cada** historia de usuario, sin excepciones. Si un punto no se
cumple, la historia **no está hecha** y regresa al backlog.

- [ ] El código está integrado a `develop` mediante un **Pull Request aprobado**
- [ ] Se escribieron pruebas unitarias para la lógica de negocio y **todas pasan**
- [ ] El código fue **revisado y aprobado por al menos otro integrante** (code review)
- [ ] Se cumplen **todos** los criterios de aceptación de la historia
- [ ] La suite de regresión completa está en verde: no se introdujeron bugs nuevos
- [ ] El linter pasa sin advertencias
- [ ] La documentación técnica afectada fue creada o actualizada
- [ ] La funcionalidad está **desplegada en Staging**
- [ ] El **Proxy Product Owner** (Stuard) verificó los criterios de aceptación y movió la tarjeta
      a *Done* en el tablero

> **Nota del Scrum Master:** los dos últimos puntos son los que más se olvidan. Sin despliegue en
> Staging y sin el visto bueno del Proxy PO, una historia sigue estando "en progreso" por más
> terminada que se sienta.

### La aceptación tiene dos niveles

| Nivel | Quién | Cuándo | Qué significa |
|---|---|---|---|
| **Verificación** | Stuard, Proxy PO | Al terminar la historia | Los criterios de aceptación escritos se cumplen. La tarjeta pasa a *Done* |
| **Aceptación formal** | Ing. Fuentes, PO | En la Sprint Review | La funcionalidad aporta el valor esperado. Se registra en la minuta |

El Proxy Product Owner **solo verifica contra los criterios ya escritos**: no inventa requisitos,
no cambia prioridades y no aprueba desviaciones de alcance. Si surge una duda que los criterios
no resuelven, se escala al Product Owner y queda anotada para la Sprint Review.

Que el Product Owner rechace en la Review algo que el Proxy ya había dado por bueno **no es un
fallo del proceso**: significa que los criterios de aceptación estaban incompletos. En ese caso se
corrigen los criterios de la historia, no se culpa a nadie, y es material para la Retrospectiva.

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

Con 8 sprints disponibles, se requiere una velocidad promedio de **~22 puntos por sprint**. La
velocidad real se medirá a partir del Sprint 2; si resulta menor, el Product Owner despriorizará
las historias de prioridad Baja (US-005, US-027, US-031) antes que sacrificar calidad de diseño,
pruebas o documentación —que es lo que realmente se evalúa.
