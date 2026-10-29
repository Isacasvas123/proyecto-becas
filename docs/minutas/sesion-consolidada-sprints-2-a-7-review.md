# Minuta de Sprint Review — Sesión consolidada de los Sprints 2 a 7
### Anexo 2 · Plataforma Nacional para la Gestión Integral de Becas

> **Alcance de esta minuta.** Recoge la Sprint Review consolidada de los Sprints 2 a 7, celebrada
> en una sola sesión conforme a lo acordado por el equipo para el tramo final del proyecto, y cubre
> el período del 10 de septiembre al 21 de octubre de 2026.
>
> Los datos de avance, calidad y entrega están tomados del repositorio y del tablero del proyecto.
> Las secciones que recogen el intercambio con el Product Owner se completan durante la sesión.

---

## Información General

| | |
|---|---|
| **Nombre del Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Sprints cubiertos** | 2, 3, 4, 5, 6 y 7 |
| **Período** | jueves 10/09/2026 al miércoles 21/10/2026 |
| **Fecha de la Reunión** | __/10/2026 |
| **Hora de inicio / fin** | __:__ / __:__ |

**Asistentes**

- Product Owner: Ing. Mario Fuentes — *(asistió: Sí / No)*
- Proxy Product Owner: Ivan \_\_\_\_\_\_\_\_\_\_\_\_
- Scrum Master: Isaac Castillo
- Development Team: Fernando \_\_\_\_\_\_\_\_\_\_\_\_ · Stuard \_\_\_\_\_\_\_\_\_\_\_\_
- Stakeholders invitados: \_\_\_\_\_\_\_\_\_\_\_\_

---

## 1. Objetivo de los Sprints cubiertos

El objetivo del período corresponde a las épicas que el cronograma del Acta de Constitución asigna
a los Sprints 2 a 7.

**Objetivo del período:** completar las épicas funcionales del MVP —cuentas y acceso, convocatorias,
solicitudes, evaluación, resolución y reportes— con los patrones de diseño previstos para cada una,
y dejar el sistema desplegado y verificable en el entorno de Staging.

**¿Se cumplió?** ☒ Sí completamente ☐ Parcialmente ☐ No

Las seis épicas quedaron entregadas y los siete patrones implementados y probados. Las mejoras al
proceso de trabajo se tratan en la retrospectiva de esta misma sesión.

---

## 2. Revisión de los Ítems del Product Backlog Completados

### 2.1 Entrega por sprint

Los sprints van de jueves a miércoles. Cada historia se registra en el sprint que le asigna el
cronograma del Acta de Constitución (§6, WBS), y la columna de evidencia remite al Pull Request en
que se integró a `develop`.

| Sprint | Período | Épica | Historias entregadas | Pts | Evidencia |
|---|---|---|---|---|---|
| 2 | 10 – 16 Sep | EPIC-01 · Cuentas y acceso | US-001, US-002, US-003 | 13 | PR #2, #4, #13, #16 |
| 3 | 17 – 23 Sep | EPIC-02 · Convocatorias | US-006, US-007, US-008 | 16 | PR #14 |
| 4 | 24 – 30 Sep | EPIC-03 · Solicitudes | US-011 a US-016 | 34 | PR #17 |
| 5 | 1 – 7 Oct | EPIC-04 · Evaluación | US-017 a US-021 | 37 | PR #18, #24 |
| 6 | 8 – 14 Oct | EPIC-05 · Resolución | US-023, US-024, US-025 | 18 | PR #19 |
| 7 | 15 – 21 Oct | EPIC-06 · Reportes y auditoría | US-028 a US-031, US-032 | 34 | PR #20, #26 |

**Total de puntos completados en el período:** 152

La velocidad media del período es de 25 puntos por sprint. El Sprint 1, cerrado con 19 puntos, y el
Sprint 8, en curso con 21, quedan fuera de este cómputo por estar fuera del período cubierto.

### 2.2 Historias no completadas

| US | Por qué no se completó | ¿Regresa al backlog? |
|---|---|---|
| US-004, US-005 | Nunca se priorizaron; prioridad Media | ☐ Sí ☐ Se congela |
| US-009, US-010 | Nunca se priorizaron; son las más baratas de las siete | ☐ Sí ☐ Se congela |
| US-022 | Depende de un servidor de correo que no existía *(ver §5)* | ☐ Sí ☐ Se congela |
| US-026, US-027 | Nunca se priorizaron; prioridad Media | ☐ Sí ☐ Se congela |

Ninguna es de prioridad Alta, y los nueve objetivos del enunciado están cubiertos.

---

## 3. Demostración del Incremento del Producto

**Entorno usado:** ☒ Staging ☐ Local

**Funcionalidad a demostrar.** El orden está pensado para que se vea un expediente completo de
principio a fin, no funciones sueltas:

1. **Portal público y consulta de estado** — convocatorias vigentes con sus cupos, y consulta por
   número y CUI sin necesidad de sesión
2. **Registro y solicitud** — alta de estudiante, perfil, postulación y carga del DPI
3. **Comité y dictamen** — creación del comité, reparto automático, dictamen del evaluador
4. **Resolución con doble aprobación** *(US-033)* — una beca de Q15,000 queda en espera tras la
   primera firma, los cupos no bajan, y el sistema rechaza que la segunda firma la dé la
   misma persona
5. **Avisos al estudiante** *(US-034)* — un aviso por cada cambio de estado, con su motivo
6. **Bitácora** *(US-032)* — filtrada por operaciones rechazadas, para enseñar que se audita
   también lo que el sistema impide

**Responsable(s) de la demo:** \_\_\_\_\_\_\_\_\_\_\_\_

**Resumen de la demostración:**

`_______________________________________________________________________`

`_______________________________________________________________________`

> **Nota para quien dirija la demostración.** Conviene detenerse en los puntos 4 y 6. En el punto 4,
> mostrar que los cupos no se descuentan con la primera firma: una aprobación a medio completar no
> debe reservar un cupo que quizá no llegue a usarse. En el punto 6, mostrar el registro de las
> operaciones rechazadas, que es lo que distingue una bitácora de auditoría de un historial.

---

## 4. Feedback de los Stakeholders y del Product Owner

> Registrar los comentarios textualmente, sin interpretarlos. Este registro es lo que permite
> demostrar después que el equipo escuchó y adaptó el producto.

| Quién | Comentario / Sugerencia / Pregunta | Tipo |
|---|---|---|
| | | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
| | | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
| | | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |
| | | ☐ Mejora ☐ Pregunta ☐ Positivo ☐ Defecto |

**¿El Product Owner emitió algún cambio de requerimiento?** ☐ Sí ☐ No

Si la respuesta es sí, se registra en
[`23-analisis-impacto-requerimientos-po.md`](../23-analisis-impacto-requerimientos-po.md) **antes
del siguiente Planning**.

### 4.1 Preguntas que el equipo lleva al Product Owner

Siguen sin respuesta desde el 16 de septiembre y afectan a historias ya marcadas como Done.
Esta sesión es la última oportunidad de resolverlas antes de la entrega.

| # | Pregunta | Historia afectada | Respuesta del PO |
|---|---|---|---|
| 1 | ¿Acepta las fórmulas de puntaje? Mérito = promedio del estudiante. Necesidad = 100 puntos si el ingreso por persona es de Q500 o menos, 0 si es de Q5,000 o más, proporcional en medio | US-018 | |
| 2 | Beca universitaria: 60 % mérito y 40 % necesidad. Nivel medio y posgrado: solo mérito. ¿Se confirma? | US-018 | |
| 3 | ¿Se confirma el tope de 50 cupos en las convocatorias de posgrado? | US-006 | |
| 4 | El umbral de la segunda aprobación quedó en Q10,000. ¿Es el correcto? | US-033 | |
| 5 | ¿Los avisos deben llegar también por correo, o basta con verlos dentro del sistema? | US-034, US-022 | |

---

## 5. Análisis y Adaptación del Product Backlog

**Ítems nuevos incorporados durante el período.** Ya están implementados; se registran aquí para
que el backlog siga siendo la única fuente de requisitos:

- [x] **US-032** — Bitácora de auditoría del sistema
- [x] **US-033** — Segunda aprobación para becas sobre Q10,000
- [x] **US-034** — Avisos al estudiante por cambio de estado
- [x] **US-035** — Recuperar la contraseña olvidada por correo *(el código entró el 28 de octubre con el PR #34)*

**Ítems sugeridos y no implementados:**

- [ ] **Doble factor para cuentas administrativas.** Surgió al revisar las buenas prácticas de
      almacenamiento de contraseñas. Se identificó y se decidió no hacerlo: el esfuerzo no cabe
      en el tiempo restante. Se deja escrito para que conste que se vio, no que se pasó por alto.
- [ ] **Envío real del correo de recuperación por SMTP.** El adaptador existe pero **no está
      verificado contra un servidor real**; hoy el mensaje se escribe en el log del servidor.

**Repriorización de ítems existentes:**

`_______________________________________________________________________`

**Decisión sobre el alcance final** *(se toma en esta sesión):*

☐ Se intenta US-009 y US-010, que son las más baratas de las siete
☐ Se congelan las siete pendientes y se declara el alcance cerrado

---

## 6. Conclusiones y Próximos Pasos

### Estado del producto a la fecha de esta sesión

| Indicador | Valor |
|---|---|
| Historias en Done | **31 de 35** |
| Objetivos del enunciado cubiertos | **9 de 9** |
| Patrones implementados y probados | **8** *(el enunciado exige 6)* |
| Pruebas | **675**: 504 unitarias y 171 de integración |
| Cobertura de sentencias | 91.83 % *(medida el 17 Oct; conviene volver a medirla antes de la entrega)* |
| PRs mergeados | **31**, todos con revisión aprobada por otro integrante |
| Staging | En línea desde el 4 de octubre |

**Resumen general:**

`_______________________________________________________________________`

### Estado de los entregables documentales

| Documento | Estado |
|---|---|
| Visión, Acta de Constitución, Política de equipo, Product Backlog | ☒ Al día |
| Casos de uso con detalle y diagramas UML | ☒ Al día |
| Arquitectura y justificación de patrones | ☒ Al día |
| Plan de Calidad (Anexo 6) y Plan de Pruebas (Anexo 7) | ☒ Al día |
| Manual Técnico y Manual de Usuario | ☒ Al día |
| Minutas de los Sprints 2 a 7 | ☒ Esta minuta |
| **Presentación Final** | ☐ **Pendiente — sin empezar** |

### Pendientes para el 31 de octubre

| Pendiente | Responsable | Estado |
|---|---|---|
| Aprobar y mergear el PR #32 | Fernando | ☒ Hecho · se reabrió como **PR #34** |
| Verificar US-033 completa en Staging | Isaac y Fernando | ☒ Hecho el 27 Oct |
| Agregar US-035 al Product Backlog | Isaac | ☒ Hecho |
| **Presentación Final** | Equipo | ☐ |
| Mergear `develop` a `main` | Isaac | ☒ Hecho · **PR #36** |
| Video del patrón State | Isaac | ☐ |
| Cerrar DEF-01, S1-10 y S1-12, o cerrarlos con motivo escrito | Equipo | ☐ |

### Próximas reuniones

- Sprint Retrospective consolidada: hoy, a continuación
- Sesión de preparación de la defensa: \_\_/10/2026

---

**Minuta elaborada por:** \_\_\_\_\_\_\_\_\_\_\_\_ · **Fecha de publicación en el repositorio:** \_\_/10/2026
