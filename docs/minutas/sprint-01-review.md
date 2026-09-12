# Minuta de Sprint Review — Sprint 1

### Anexo 2 · Plataforma Nacional para la Gestión Integral de Becas

> **Estado de esta minuta: PREPARADA, no celebrada.** Todo lo que está lleno son **datos
> verificables del repositorio** al 12 de septiembre de 2026, reunidos antes de la reunión para no
> gastar la reunión averiguándolos. Lo que queda en blanco —asistencia, la demostración y el
> feedback del Product Owner— **se llena durante la reunión del domingo 13**, porque todavía no ha
> ocurrido. Registrar de antemano algo que no pasó sería inventar evidencia.

---

## Información General

|                         |                                                                    |
| ----------------------- | ------------------------------------------------------------------ |
| **Nombre del Proyecto** | Plataforma Nacional para la Gestión Integral de Becas              |
| **Número de Sprint**    | 1                                                                  |
| **Período del Sprint**  | jueves 03/09/2026 al miércoles 09/09/2026                          |
| **Fecha de la Reunión** | domingo 13/09/2026 — **3 días después de lo previsto** (ver §7)     |
| **Hora de inicio / fin** | \_\_:\_\_ / \_\_:\_\_                                             |

**Asistentes**

- Product Owner: Ing. Mario Fuentes — _(asistió: Sí / No)_ `______`
- Scrum Master: Isaac Castillo
- Development Team: Ivan `______` · Fernando `______` · Stuard `______`
- Stakeholders invitados: `______`

---

## 1. Objetivo del Sprint (Sprint Goal)

**Declaración** (copiada del Planning del 3 de septiembre):

> _"Dejar el equipo constituido y con acceso, el repositorio funcionando con su flujo de trabajo,
> y el esqueleto técnico revisado, entendido y aprobado por el equipo."_

**¿Se cumplió?** ☐ Sí completamente ☑ **Parcialmente** ☐ No

Se cumplió en tres de sus cuatro partes, y conviene ser preciso sobre cuál falló:

| Parte del objetivo                        | Resultado                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Equipo constituido y con acceso           | ✅ Acta y Política firmadas por los cuatro; los tres aceptaron la invitación al repositorio       |
| Repositorio funcionando con su flujo      | ✅ 5 Pull Requests abiertos, revisados y mergeados a `develop`; CI en verde                       |
| Esqueleto técnico **revisado**            | ✅ Fernando lo revisó con 3 comentarios de línea (6 en total entre los dos PRs que revisó)                 |
| Esqueleto **entendido por el equipo**     | ⚠️ **No verificable.** Dos de los cuatro no revisaron ningún documento de arquitectura ni backlog |

---

## 2. Revisión de los Ítems del Sprint Backlog

### 2.1 Tareas del sprint (S1-01 a S1-12)

| #     | Tarea                                                        | Pts   | Estado Final       | Notas                                                                 |
| ----- | ------------------------------------------------------------ | ----- | ------------------ | --------------------------------------------------------------------- |
| S1-01 | Acta de Constitución completa y firmada                      | 3     | ☑ Completado       | Con RACI, WBS y objetivos SMART                                       |
| S1-02 | Política de Trabajo firmada, con sanciones acordadas         | 2     | ☑ Completado       | Las tres sanciones del Anexo 3 §6 elegidas                            |
| S1-03 | Invitar a los 3 al repositorio y que acepten                 | 1     | ☑ Completado       | Los tres con permiso de escritura                                     |
| S1-04 | Tablero en GitHub Projects con el backlog cargado            | 2     | ☑ Completado       | 44 tarjetas                                                           |
| S1-05 | Estudiar el walking skeleton, criticarlo y abrir su PR       | 8     | ☑ Completado       | PR #1, 50 archivos                                                    |
| S1-06 | Revisar el PR del skeleton con comentarios reales            | 2     | ☑ Completado       | Fernando, 3 comentarios de línea sustantivos                          |
| S1-07 | Revisar y hacer propia la configuración de Git y CI          | 3     | ☐ **No completado** | Nadie la tomó                                                         |
| S1-08 | Revisar el Documento de Arquitectura y firmarlo o corregirlo | 5     | ☐ **No completado** | Stuard la empezó, no la cerró                                         |
| S1-09 | Revisar la Visión del Producto y las User Personas           | 3     | ☐ **No completado** | Nadie la tomó                                                         |
| S1-10 | Revisar y priorizar el Product Backlog con el equipo         | 5     | ☐ **No completado** | Stuard la empezó, no la cerró                                         |
| S1-11 | Definition of Done acordada y publicada                      | 1     | ☑ Completado       | `docs/04-product-backlog.md` §6, 9 puntos                             |
| S1-12 | Corregir los 3 defectos detectados en el esqueleto           | 5     | ☐ **No completado** | 2 de 3. El tercero (US-008) se difirió al Sprint 3 con decisión escrita |

**Total comprometido:** **40 puntos**
**Total completado:** **19 puntos**
**Velocidad del Sprint 1:** **19**

> Esta velocidad es el dato más útil que produjo el sprint: es la base real para estimar el
> Sprint 2, en lugar de volver a comprometer 40 puntos porque suena bien.

### 2.2 Historias de usuario trabajadas

Dos historias del **Sprint 2 se adelantaron** al Sprint 1 porque el esqueleto técnico las
necesitaba para ser una rebanada vertical de verdad.

| US         | Historia                             | Pts | Estado Final        | Por qué                                                             |
| ---------- | ------------------------------------ | --- | ------------------- | ------------------------------------------------------------------- |
| **US-002** | Inicio de sesión                     | 3   | ☐ **No completado** | Falta el bloqueo tras 5 intentos fallidos, que es criterio escrito  |
| **US-003** | Control de acceso por rol            | 5   | ☐ **No completado** | Los 4 criterios de código cumplen; falta el despliegue en Staging   |
| **US-008** | Listado público de convocatorias     | 3   | ☐ **No completado** | El backend lo expone sin sesión; el frontend sigue exigiendo login  |

> ⚠️ **Regla del equipo aplicada sin excepciones.** Las tres historias funcionan en local y tienen
> pruebas en verde. **Ninguna está completada**, porque el punto 8 de nuestra Definition of Done
> exige despliegue en Staging y verificación, y Staging no existe todavía. Marcarlas como hechas
> sería exactamente lo que la propia DoD advierte que no hagamos.

### 2.3 Historias no completadas — motivo y destino

| US / Tarea            | Por qué no se completó                                     | Qué falta                                        | ¿Regresa al backlog? |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------ | -------------------- |
| US-002                | Criterio de aceptación incompleto                          | Bloqueo de cuenta tras 5 intentos fallidos, 15 min | Sí → Sprint 2        |
| US-003                | DoD punto 8                                                | Staging levantado y verificado                   | Sí → Sprint 2        |
| US-008                | Decisión de alcance                                        | Separar el listado público del panel en el frontend | Sí → Sprint 3        |
| S1-07, S1-09          | Nadie las tomó                                             | La revisión completa                             | Sí → Sprint 2        |
| S1-08, S1-10          | Empezadas y no cerradas                                    | Cerrar la revisión y firmar o corregir           | Sí → Sprint 2        |
| S1-12                 | 2 de 3 defectos corregidos                                 | El tercero es US-008                             | Sí → Sprint 3        |

---

## 3. Demostración del Incremento del Producto

**Funcionalidad demostrada:**

- Inicio de sesión con usuario y contraseña, token de 8 horas, contraseña con hash bcrypt
- Listado de convocatorias publicadas y vigentes, con el portal rediseñado
- Control de acceso: un rol insuficiente recibe 403, no el recurso
- `/health` y `/ready` como dos rutas distintas: `/ready` devuelve 503 si PostgreSQL no responde

**Responsable(s) de la demo:** `______`

**Entorno usado:** ☐ Staging ☑ **Local**

> **Justificación obligada de por qué no fue Staging:** el entorno **no existe todavía**. Es el
> impedimento principal del sprint y está declarado desde el 5 de septiembre. La configuración
> quedó escrita y revisable en el PR #7 (`render.yaml`, `apps/api/Dockerfile`, workflow de
> verificación y `docs/17-staging.md`), pero levantarlo requiere crear la cuenta del servicio.
>
> **Consecuencia que hay que decir en voz alta ante el Product Owner:** mientras no exista
> Staging, **él no puede aceptar formalmente ninguna historia**, porque no tiene dónde verla sin
> que alguien del equipo le preste su máquina. No es un detalle de infraestructura: es lo que
> bloquea el cierre de todo el sprint.

**Resumen de la demostración:**

`_______________________________________________________________________`

`_______________________________________________________________________`

---

## 4. Feedback de los Stakeholders y del Product Owner

> Registrar los comentarios **textualmente**, sin interpretarlos.

| Quién | Comentario / Sugerencia / Pregunta | Tipo                                   |
| ----- | ---------------------------------- | -------------------------------------- |
|       |                                    | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
|       |                                    | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
|       |                                    | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
|       |                                    | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |

**¿El Product Owner emitió algún cambio de requerimiento?** ☐ Sí ☐ No

| Cambio solicitado | Componentes afectados | Esfuerzo estimado | Responsable del análisis |
| ----------------- | --------------------- | ----------------- | ------------------------ |
|                   |                       |                   |                          |

### 4.1 Preguntas que conviene anticipar

No es feedback: es preparación. Las cuatro que es más probable que caigan, con la respuesta corta.

| Pregunta probable                                        | Respuesta de 30 segundos                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _¿Por qué no hay nada terminado si el sistema funciona?_  | Porque nuestra DoD exige Staging y verificación suya. Preferimos no tener nada "hecho" a llamar hecho algo que usted no ha podido aceptar.                  |
| _¿Qué arquitectura usan y por qué?_                       | Monolito modular en capas con inversión de dependencias. La chuleta de 30 segundos está en `docs/16-chuleta-arquitectura.md`.                              |
| _Solo veo un patrón implementado de los seis._            | Correcto: el Adapter. Los otros están justificados y asignados a los sprints donde aparece el problema que resuelven. Implementarlos antes sería adornar.  |
| _¿Por qué casi todos los commits son de una persona?_     | Es el hallazgo central de nuestra retrospectiva y está documentado con su causa y su plan de corrección. Ver la minuta de retrospectiva de este mismo día. |

---

## 5. Análisis y Adaptación del Product Backlog

**Nuevos ítems sugeridos para el Product Backlog:**

- [x] **DEF-01** — `ConvocatoriaPrismaRepositorio` sin cobertura de pruebas (issue #6, abierto por Fernando)
- [x] **S1-13** — Levantar el entorno de Staging y verificarlo
- [ ] **Bloqueo de cuenta tras 5 intentos fallidos** — separar de US-002 como ítem propio, ya que es lo único que impide cerrarla
- [ ] **Separar el listado público del panel de administración** — es el defecto 3 y el incumplimiento de US-008

**Repriorización de ítems existentes:**

Staging pasa a ser la **prioridad número uno del Sprint 2**, por encima de cualquier historia
nueva. El razonamiento es aritmético: sin Staging la DoD no se puede cumplir, así que cada
historia que se desarrolle se acumula en un estado "terminada pero no aceptable". Desarrollar más
funcionalidad antes de resolverlo solo agranda esa pila.

**Discusión sobre el contexto:**

`_______________________________________________________________________`

---

## 6. Conclusiones y Próximos Pasos

**Resumen general:**

`_______________________________________________________________________`

**Estado de los entregables documentales:**

| Documento                                    | Estado                         |
| -------------------------------------------- | ------------------------------ |
| Acta de Constitución (Anexo 1)               | ☑ Al día                       |
| Política de Trabajo (Anexo 3)                | ☑ Al día                       |
| Visión del Producto y Backlog (Anexo 4)      | ☑ Al día                       |
| Diagramas del Anexo 5                        | ☑ Al día — verificados contra el código |
| Documento de Arquitectura y su justificación | ☑ Al día                       |
| Justificación de Patrones                    | ☑ Al día — 1 de 6 implementado |
| Matriz de trazabilidad                       | ☑ Al día                       |
| **Detalle de casos de uso**                  | ☐ **Incompleto** — 10 de 13 (faltan CU-03, CU-13, CU-16) → Sprint 3 |
| Plan de Aseguramiento de Calidad (Anexo 6)   | ⬜ No vencido — WBS 7.2, para el 21 Oct |
| Plan de Pruebas (Anexo 7)                    | ⬜ No vencido — WBS 7.2, para el 21 Oct |
| Manual Técnico                               | ⬜ No vencido — WBS 8.1, para el 28 Oct |
| Manual de Usuario                            | ⬜ No vencido — WBS 8.2, para el 28 Oct |

> Los cuatro últimos **no están atrasados**: el WBS del Acta los sitúa en los Sprints 7 y 8. Se
> mencionan porque el equipo acordó **adelantarlos** mientras Staging siga bloqueado, para no
> acumular toda la documentación en las dos últimas semanas.

**Próximas reuniones**

- Sprint Retrospective: hoy, a continuación — ver [`sprint-01-retro-planning.md`](sprint-01-retro-planning.md) Parte 1
- Próxima Sprint Planning: hoy, después de la retrospectiva — mismo archivo, Parte 2
- Próxima Sprint Review: **miércoles 16/09/2026** (ver §7)

---

## 7. Nota sobre el calendario — leer antes del Planning

El Sprint 1 cerró el **miércoles 9**. La Sprint Review estaba prevista para el **jueves 10** y se
celebra el **domingo 13**: tres días tarde, porque no se logró reunir al equipo.

Con la cadencia acordada de jueves a miércoles, **el Sprint 2 empezó el jueves 10 y ya lleva
tres días corriendo sin haber sido planificado**. Al terminar la reunión del domingo quedarán
**tres días hábiles** de ese sprint: lunes 14, martes 15 y miércoles 16.

Por qué no se puede simplemente correr todo una semana:

| Escenario                                  | Consecuencia                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Mantener la cadencia (Sprint 2 = 10 al 16) | Sprint 2 de 3 días útiles. Hay que recortar alcance, pero **los 8 sprints se conservan** |
| Correr todo una semana                     | Quedan **7 sprints** antes del 31 de octubre, y el Sprint 7 del WBS es el de pruebas y cobertura |

Los 8 sprints semanales desde el 3 de septiembre terminan el **28 de octubre**, tres días antes de
la entrega. No hay semana de holgura que gastar.

**Recomendación del Scrum Master:** mantener la cadencia y recortar el alcance del Sprint 2 a lo
que cabe en tres días, contando la velocidad real de 19 puntos. La decisión se toma en el Planning.

---

**Minuta elaborada por:** Isaac Castillo (Scrum Master) · **Preparada el:** 12/09/2026 · **Fecha de publicación en el repositorio:** \_\_/\_\_/2026
