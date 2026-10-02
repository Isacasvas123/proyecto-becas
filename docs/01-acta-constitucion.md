# Acta de Constitución del Equipo
### Anexo 1 — Proyecto Final, Análisis de Sistemas II (0910-037)

| | |
|---|---|
| **Universidad** | Mariano Gálvez de Guatemala |
| **Facultad** | Ingeniería en Sistemas de Información y Ciencias de la Computación |
| **Curso** | 0910-037 Análisis de Sistemas II — 8º Ciclo |
| **Catedrático / Product Owner** | Ing. Mario Fuentes |
| **Fecha de elaboración** | 3 de septiembre de 2026 |
| **Versión** | 1.0 |

---

## 1. Identificación del Equipo

**Nombre del equipo:**`ControlExe`

**Proyecto asignado:** Plataforma Nacional para la Gestión Integral de Becas

---

## 2. Integrantes del Equipo

| Nombre completo | Rol / Clave funcional | Correo electrónico | Teléfono |
|---|---|---|---|
| Isaac Castillo | Scrum Master · Documentación de proceso · Manual Técnico | isacasvas4321@gmail.com | 42059194 |
| Ivan Castellan | Developer · Arquitectura · DevOps (Git, CI/CD, despliegues) | jose.100.ivan@gmail.com | 35715810 |
| Fernando Herrera | Developer · Diagramas UML · Aseguramiento de calidad y pruebas | williamod090@gmail.com | 46179226 |
| Stuard Estrada | Developer · **Proxy Product Owner** · Patrones de diseño · Manual de Usuario | emersonstuarde@gmail.com | 54344578 |

> **Nota sobre los roles:** los cuatro integrantes programan. La columna de rol indica quién es
> **responsable de que ese entregable exista y esté completo**, no quién lo hace solo.

### Product Owner y Proxy Product Owner

**El Product Owner es el catedrático, Ing. Mario Fuentes**, conforme al enunciado del proyecto,
y es externo al equipo de desarrollo. Le corresponde priorizar el Product Backlog, emitir los
cambios de requerimientos y **dar la aceptación formal** de las historias en la Sprint Review.

Ahora bien, el Product Owner no participa en el día a día del equipo, y una historia no puede
quedarse en el limbo hasta la siguiente clase esperando que alguien diga si está aceptada. Por
eso el equipo designa un **Proxy Product Owner**, figura reconocida en Scrum precisamente para
cuando el PO no está disponible de forma continua.

| | Product Owner | Proxy Product Owner |
|---|---|---|
| **Quién** | Ing. Mario Fuentes | **Stuard** |
| **Decide** | Qué se construye y en qué orden | Si lo construido cumple los criterios ya escritos |
| **Cuándo** | Sprint Review y clases | Día a día, conforme se terminan las historias |
| **Alcance** | Puede crear, cambiar y despriorizar historias | **No puede cambiar el alcance ni inventar criterios** |

**Límite explícito del Proxy.** Solo verifica el cumplimiento de los criterios de aceptación que
ya están escritos en el Product Backlog. No decide si una funcionalidad debía existir, no altera
prioridades y no aprueba desviaciones de alcance: eso sigue siendo exclusivo del Product Owner.
Si aparece una duda que los criterios no resuelven, se escala al catedrático y se registra.

**Por qué Stuard y no el Scrum Master.** Concentrar Scrum Master y Proxy Product Owner en una
sola persona es un anti-patrón: el Scrum Master protege el proceso y al equipo, mientras que el
Product Owner decide sobre el producto. Si Isaac ocupara ambos roles, acabaría juzgando el
resultado de su propia facilitación. Stuard es además responsable de la Visión del Producto, del
Product Backlog y del Manual de Usuario, así que es quien está más cerca de la voz del usuario.

**Cómo se registra la aceptación.** El Proxy Product Owner es el **único** que mueve una tarjeta
a la columna *Done* en el tablero de GitHub Projects. Ese movimiento constituye la aceptación de
la historia. Las historias aceptadas y rechazadas durante la semana se listan además en la minuta
del jueves.

---

## 3. Objetivo General y Objetivos Específicos (criterios SMART)

### Objetivo General

Diseñar e implementar, entre el 3 de septiembre y el 31 de octubre de 2026, una plataforma web
para la gestión integral del ciclo de vida de las becas del Ministerio de Educación, aplicando
una arquitectura justificada, principios SOLID y patrones de diseño documentados, entregando
incrementos funcionales verificables al final de cada uno de los 8 sprints semanales.

### Objetivos Específicos

**OE-1.** Implementar, para el 14 de octubre de 2026, los seis módulos funcionales del MVP
—convocatorias, estudiantes, solicitudes, documentación, evaluaciones y consulta de estado—
con al menos una historia de usuario aceptada por el Product Owner en cada uno.

**OE-2.** Implementar y documentar, antes del 21 de octubre de 2026, un mínimo de seis patrones
de diseño (dos creacionales, dos estructurales y dos de comportamiento), cada uno con una
justificación técnica que responda qué problema resuelve, qué alternativas se descartaron, por
qué se eligió y qué ventajas aporta.

**OE-3.** Mantener durante los 8 sprints un repositorio Git con el 100% de los cambios
integrados mediante Pull Request revisado y aprobado por un integrante distinto al autor, sin
ningún commit directo a la rama `main`.

**OE-4.** Alcanzar antes del 21 de octubre de 2026 una cobertura de pruebas unitarias de al
menos el 60% sobre la capa de dominio y aplicación, con la totalidad de la suite en verde en
cada integración a la rama `develop`.

**OE-5.** Documentar el análisis de impacto de todo cambio de requerimiento emitido por el
Product Owner dentro de los 7 días siguientes a su recepción, indicando componentes afectados,
esfuerzo estimado y decisión de diseño adoptada.

---

## 4. Asignación de Roles — Esquema RACI

**R** = Responsable (ejecuta) · **A** = Aprobador (valida) · **C** = Consultado · **I** = Informado

| Actividad | R | A | C | I |
|---|---|---|---|---|
| Facilitación de ceremonias Scrum | Isaac | Equipo | — | Product Owner |
| Minutas de Sprint Review y Retrospective | Isaac | Equipo | Todos | Product Owner |
| Tablero Scrum y seguimiento de velocidad | Isaac | Equipo | Todos | Product Owner |
| Product Backlog y refinamiento de historias | Isaac | **Product Owner** | Equipo | — |
| Documento y justificación de Arquitectura | Ivan | Equipo | Fernando | Product Owner |
| Configuración de Git, ramas y protecciones | Ivan | Equipo | — | Todos |
| Integración continua (CI) y despliegues | Ivan | Equipo | Fernando | Todos |
| Diagramas UML (casos de uso, componentes, clases) | Fernando | Equipo | Ivan, Stuard | Product Owner |
| Plan de Aseguramiento de Calidad (QAP) | Fernando | Equipo | Todos | Product Owner |
| Plan de Pruebas y cobertura | Fernando | Equipo | Todos | Product Owner |
| Selección y justificación de patrones de diseño | Stuard | Equipo | Ivan | Product Owner |
| Modelo de dominio y esquema de base de datos | Fernando | Equipo | Ivan, Stuard | Todos |
| Desarrollo de módulos funcionales | Todos | Equipo (code review) | — | Product Owner |
| Pruebas unitarias del código propio | Todos | Fernando | — | Equipo |
| Code review de Pull Requests | Todos | Equipo | — | — |
| Manual Técnico | Isaac | Equipo | Ivan | Product Owner |
| Manual de Usuario | Stuard | Equipo | Todos | Product Owner |
| Presentación final | Isaac | Equipo | Todos | Product Owner |
| Verificación diaria de criterios de aceptación | **Stuard** (Proxy PO) | Equipo | Autor de la historia | Todos |
| Aceptación formal de historias de usuario | **Product Owner** | Product Owner | Proxy PO, Equipo | Equipo |
| Cambios de alcance y prioridad del backlog | **Product Owner** | Product Owner | Equipo | Equipo |

---

## 5. Protocolo de Comunicación Única

**Plataforma seleccionada:** `Whatsapp`

### Normas de uso

1. **Canal único.** Toda comunicación del proyecto ocurre en la plataforma seleccionada. Lo que
   se acuerda por otro medio no cuenta hasta que se escribe ahí.
2. **Estructura de canales:**
   - `#anuncios` — decisiones, fechas, cambios del Product Owner
   - `#daily` — reporte asincrónico diario en los días de trabajo de cada quien
   - `#tecnico` — dudas de código, arquitectura y diseño
   - `#bloqueos` — impedimentos que requieren acción inmediata del Scrum Master
3. **Formato del daily.** En cada uno de sus dos días de trabajo, cada integrante publica:
   *qué hice · qué haré · qué me bloquea*. No hay reunión diaria en vivo.
4. **Tiempo de respuesta.** Máximo 12 horas en día hábil. Un mensaje en `#bloqueos` se atiende
   el mismo día.
5. **Ausencias.** Quien prevea no poder cumplir con su turno lo avisa **con anticipación**, no
   después. El Anexo 3 lo establece como responsabilidad individual explícita.
6. **Code review.** Los comentarios técnicos van en el Pull Request, no en el chat, para que
   queden en el historial del repositorio.
7. **Decisiones.** Toda decisión relevante se registra en la minuta del sprint correspondiente.

---

## 6. Cronograma del Proyecto (WBS)

Sprints semanales de **jueves a miércoles**. Ceremonias todos los jueves.

| # | Tarea / Subtarea | Fecha de entrega / Hito | Responsable | Comentarios |
|---|---|---|---|---|
| 1 | **Sprint 1 — Fundación** | Mié 9 Sep 2026 | Equipo | |
| 1.1 | Acta de Constitución y Política de Trabajo | Jue 3 Sep | Isaac | Anexos 1 y 3 |
| 1.2 | Visión del Producto y User Personas | Mié 9 Sep | Stuard | Anexo 4 §2-3 |
| 1.3 | Product Backlog inicial (6 epics, ~30 historias) | Mié 9 Sep | Stuard, Isaac | Anexo 4 §4 |
| 1.4 | Repositorio Git, ramas, CI | Mié 9 Sep | Ivan | Protección de `main` pendiente de GitHub Pro |
| 1.5 | Walking skeleton: estudiar, criticar y abrir su PR | Mié 9 Sep | Fernando | Construido el 2 Sep; su dueño debe poder defenderlo |
| 1.6 | Documento de Arquitectura v1 | Mié 9 Sep | Ivan | Anexo 5 §2 |
| 1.7 | Invitar al equipo al repositorio | Jue 3 Sep | Isaac | Bloquea a los tres integrantes |
| 1.8 | Corregir los 3 defectos detectados en el esqueleto | Mié 9 Sep | Fernando | `/health`, enums duplicados, carpetas sin documentar |
| 2 | **Sprint 2 — Staging y calidad de la evidencia** | Mié 16 Sep 2026 | Equipo | Feriado 15 Sep · **sprint de 3 días**: la Review del Sprint 1 se celebró el domingo 13, no el jueves 10 |
| 2.1 | Diagrama de casos de uso + detalle de cada caso | ~~Mié 16 Sep~~ → **entregado Sáb 5 Sep** | Fernando | Anexo 5 §3.1 · adelantado al Sprint 1. Faltan los detalles de CU-03, CU-13 y CU-16 → Sprint 3 |
| 2.2 | Diagrama de componentes y de clases | ~~Mié 16 Sep~~ → **entregado Sáb 5 Sep** | Fernando | Anexo 5 §3.2-3.3 · adelantado al Sprint 1 y verificado contra el código el 11 Sep |
| 2.3 | Esquema de BD y primera migración versionada | ~~Mié 16 Sep~~ → **entregado Jue 3 Sep** | Ivan | Dos migraciones versionadas en `prisma/migrations/` |
| 2.4 | Registro, perfil y recuperación de contraseña | **movido** | Isaac, Stuard | EPIC-01 · 13 pts no caben en una capacidad de 8. **US-001 → Sprint 3; US-004 y US-005 → Sprint 4.** Decidido en el Planning del 13 Sep |
| 2.5 | Requisitos No Funcionales y DoD publicados | ~~Mié 16 Sep~~ → **entregado Jue 3 Sep** | Fernando | Anexo 4 §5-6 · adelantado al Sprint 1 |
| 2.6 | Guard de autenticación y control de acceso por rol | ~~Mié 16 Sep~~ → **entregado Mié 9 Sep** | Isaac | US-003 · adelantado al Sprint 1. 32 pruebas de integración |
| 2.7 | **Entorno de Staging desplegado y verificado** | Mié 16 Sep | Ivan | **Adelantado del 3.3.** Sin esto el punto 8 de la DoD es incumplible y ninguna historia puede cerrarse |
| 2.8 | Probar los tres adaptadores del patrón Adapter | Mié 16 Sep | Fernando | Hoy a 0 % de cobertura: es el único patrón implementado y el que se presentará al PO |
| 2.9 | Corregir la medición de cobertura para que incluya las e2e | Mié 16 Sep | Ivan | El número actual (41.89 %) está medido solo con las unitarias |
| 3 | **Sprint 3 — Convocatorias** | Mié 23 Sep 2026 | Equipo | |
| 3.1 | Módulo de convocatorias (CRUD y publicación) | Mié 23 Sep · **crear, publicar y listado entregados Sáb 12 Sep** | Isaac, Fernando | EPIC-02 · faltan cerrar (US-009) y editar (US-010) |
| 3.2 | Patrón Factory Method implementado y documentado | ~~Mié 23 Sep~~ → **entregado Sáb 12 Sep** | Stuard | Creacional 1 · 18 pruebas propias |
| 3.3 | ~~Entorno de Staging desplegado y accesible~~ | **movido al 2.7** | Ivan | Se adelantó al Sprint 2 por bloquear la DoD completa |
| 3.4 | Registro de estudiante (US-001) + bloqueo tras 5 intentos (US-002) | ~~Mié 23 Sep~~ → **entregado** (bloqueo 12 Sep, registro 16 Sep) | Isaac, Stuard | Movido del 2.4. Adelantado completo |
| 3.5 | Cerrar las 4 revisiones documentales del Sprint 1 (S1-07 a S1-10) | Mié 23 Sep | Fernando, Stuard, Ivan | Deuda declarada del Sprint 1 |
| 3.6 | Detalle de los casos de uso CU-03, CU-13 y CU-16 | Mié 23 Sep | Fernando | Completa el 2.1 |
| 4 | **Sprint 4 — Estudiantes y solicitudes** | Mié 30 Sep 2026 | Equipo | |
| 4.1 | Creación de solicitudes | ~~Mié 30 Sep~~ → **entregado Mié 16 Sep** | Isaac, Ivan | EPIC-03 completa: perfil (US-011), crear, cargar, enviar, listar e historial (US-012 a US-016) |
| 4.4 | Gestión de perfil (US-004) y recuperación de contraseña (US-005) | Mié 30 Sep | Isaac, Stuard | Movidos del 2.4 |
| 4.2 | Patrón State (ciclo de vida de la solicitud) | ~~Mié 30 Sep~~ → **entregado Mié 16 Sep** | Stuard | Comportamiento 1 · los 30 pares estado × acción probados |
| 4.3 | Carga de documentación + patrón Adapter | ~~Mié 30 Sep~~ → **entregado Mié 16 Sep** | Fernando | Estructural 1 · almacenamiento local; el de nube queda para cuando haya proveedor |
| 5 | **Sprint 5 — Evaluación** | Mié 7 Oct 2026 | Equipo | |
| 5.1 | Comités evaluadores y asignación de solicitudes | Mié 7 Oct | Isaac, Fernando | EPIC-04 |
| 5.2 | Patrón Strategy (criterios de puntuación) | Mié 7 Oct | Stuard | Comportamiento 2 |
| 5.3 | Notificaciones de cambio de estado | Mié 7 Oct | Ivan | Observer (opcional) |
| 6 | **Sprint 6 — Resolución y consulta** | Mié 14 Oct 2026 | Equipo | |
| 6.1 | Aprobación, rechazo y adjudicación de becas | Mié 14 Oct | Isaac, Stuard | EPIC-05 |
| 6.2 | Consulta pública del estado de una beca | Mié 14 Oct | Fernando | Sin autenticación |
| 6.3 | Patrón Facade + análisis de impacto de cambio del PO | Mié 14 Oct | Ivan | Estructural 2 |
| 7 | **Sprint 7 — Reportes y calidad** | Mié 21 Oct 2026 | Equipo | Feriado 20 Oct |
| 7.1 | Módulo de reportes + patrón Builder | Mié 21 Oct | Stuard, Isaac | Creacional 2 · EPIC-06 |
| 7.2 | QAP y Plan de Pruebas finales | Mié 21 Oct | Fernando | Anexos 6 y 7 |
| 7.3 | Pruebas de integración, regresión y cobertura ≥60% | Mié 21 Oct | Fernando, Ivan | |
| 8 | **Sprint 8 — Cierre técnico** | Mié 28 Oct 2026 | Equipo | |
| 8.1 | Manual Técnico | Mié 28 Oct | Isaac | |
| 8.2 | Manual de Usuario | Mié 28 Oct | Stuard | |
| 8.3 | Justificación final de Arquitectura y Patrones | Mié 28 Oct | Ivan, Stuard | |
| 8.4 | Corrección de bugs y despliegue estable | Mié 28 Oct | Todos | **Code freeze** |
| 9 | **Cierre y entrega** | Sáb 31 Oct 2026 | Equipo | |
| 9.1 | Presentación final y ensayo de demo | Vie 30 Oct | Isaac | |
| 9.2 | **Entrega del proyecto** | **Sáb 31 Oct** | Equipo | Hito final |

---

## 7. Aprobación

Los integrantes firman en conformidad con los objetivos, roles, protocolo de comunicación y
cronograma aquí establecidos.

| Nombre | Rol | Firma | Fecha |
|---|---|---|---|
| Isaac Castillo | Scrum Master | Firmado | 03/09/2026 |
| Ivan Castellan | Developer | Firmado | 03/09/2026 |
| Fernando Herrera | Developer | Firmado | 03/09/2026 |
| Stuard Estrada | Developer |Firmado | 03/09/2026 |
