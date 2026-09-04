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

**Nombre del equipo:** `___________________________`

**Proyecto asignado:** Plataforma Nacional para la Gestión Integral de Becas

---

## 2. Integrantes del Equipo

| Nombre completo | Rol / Clave funcional | Correo electrónico | Teléfono |
|---|---|---|---|
| Isaac ____________ | Scrum Master · Documentación de proceso · Manual Técnico | isacasvas4321@gmail.com | ______ |
| Ivan ____________ | Developer · Arquitectura · DevOps (Git, CI/CD, despliegues) | ______ | ______ |
| Fernando ____________ | Developer · Diagramas UML · Aseguramiento de calidad y pruebas | ______ | ______ |
| Stuard ____________ | Developer · Patrones de diseño · Backlog · Manual de Usuario | ______ | ______ |

> **Nota sobre los roles:** los cuatro integrantes programan. La columna de rol indica quién es
> **responsable de que ese entregable exista y esté completo**, no quién lo hace solo. El Product
> Owner es el catedrático y es externo al equipo de desarrollo.

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
| Aceptación de historias de usuario | **Product Owner** | Product Owner | Equipo | Equipo |

---

## 5. Protocolo de Comunicación Única

**Plataforma seleccionada:** `___________________________`

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
| 2 | **Sprint 2 — Análisis y dominio** | Mié 16 Sep 2026 | Equipo | Feriado 15 Sep |
| 2.1 | Diagrama de casos de uso + detalle de cada caso | Mié 16 Sep | Fernando | Anexo 5 §3.1 |
| 2.2 | Diagrama de componentes y de clases | Mié 16 Sep | Fernando | Anexo 5 §3.2-3.3 |
| 2.3 | Esquema de BD y primera migración versionada | Mié 16 Sep | Ivan | |
| 2.4 | Registro, perfil y recuperación de contraseña | Mié 16 Sep | Isaac, Stuard | EPIC-01 · el login (US-002) se adelantó al Sprint 1 |
| 2.6 | Guard de autenticación y control de acceso por rol | Mié 16 Sep | Isaac | US-003 · seguridad real en el backend |
| 2.5 | Requisitos No Funcionales y DoD publicados | Mié 16 Sep | Fernando | Anexo 4 §5-6 |
| 3 | **Sprint 3 — Convocatorias** | Mié 23 Sep 2026 | Equipo | |
| 3.1 | Módulo de convocatorias (CRUD y publicación) | Mié 23 Sep | Isaac, Fernando | EPIC-02 |
| 3.2 | Patrón Factory Method implementado y documentado | Mié 23 Sep | Stuard | Creacional 1 |
| 3.3 | Entorno de Staging desplegado y accesible | Mié 23 Sep | Ivan | **Hito: PO puede probar** |
| 4 | **Sprint 4 — Estudiantes y solicitudes** | Mié 30 Sep 2026 | Equipo | |
| 4.1 | Registro de estudiantes y creación de solicitudes | Mié 30 Sep | Isaac, Ivan | EPIC-03 |
| 4.2 | Patrón State (ciclo de vida de la solicitud) | Mié 30 Sep | Stuard | Comportamiento 1 |
| 4.3 | Carga de documentación + patrón Adapter | Mié 30 Sep | Fernando | Estructural 1 |
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
| Isaac ____________ | Scrum Master | ______________ | ___/___/2026 |
| Ivan ____________ | Developer | ______________ | ___/___/2026 |
| Fernando ____________ | Developer | ______________ | ___/___/2026 |
| Stuard ____________ | Developer | ______________ | ___/___/2026 |
