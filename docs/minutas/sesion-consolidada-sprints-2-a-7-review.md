# Minuta de Sprint Review — Sesión consolidada de los Sprints 2 a 7
### Anexo 2 · Plataforma Nacional para la Gestión Integral de Becas

> **Por qué esta minuta cubre seis sprints y no uno.**
>
> Entre el 10 de septiembre y el 21 de octubre el equipo entregó 31 historias y los ocho patrones,
> pero **no celebró ninguna ceremonia**. La última documentada es la del Sprint 1, del 13 de
> septiembre.
>
> Escribir seis minutas con fecha retroactiva sería inventar reuniones que no ocurrieron, y eso es
> peor que no tenerlas: una minuta falsa invalida a las verdaderas. En lugar de eso se celebra
> **una sesión consolidada**, se registra aquí lo que se diga en ella, y queda constancia honesta
> del hueco. El informe de hechos que la alimenta es
> [`22-informe-sprints-2-a-6.md`](../22-informe-sprints-2-a-6.md).
>
> **Las secciones con datos están llenas y son verificables.** Las que recogen lo que se dijo en la
> reunión se llenan **durante** la sesión.

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

> Ninguno de estos sprints tuvo un Sprint Goal declarado, porque no hubo Planning. Lo que sigue es
> el objetivo **implícito** que se desprende del trabajo entregado, reconstruido desde el
> repositorio. Se registra como tal, no como un objetivo acordado en su momento.

**Objetivo implícito:** completar las cuatro épicas funcionales del MVP —solicitudes, evaluación,
resolución y reportes— con sus patrones de diseño, y dejar el sistema desplegado y verificable en
un entorno de Staging.

**¿Se cumplió?** ☒ Sí completamente ☐ Parcialmente ☐ No

**Observación que la sesión debe tratar.** El objetivo de **producto** se cumplió. El objetivo de
**proceso** —trabajar mediante Scrum, que el enunciado evalúa de forma explícita— no. Las dos cosas
son ciertas a la vez, y conviene no dejar que la primera tape a la segunda.

---

## 2. Revisión de los Ítems del Product Backlog Completados

### 2.1 Entrega por sprint

Los sprints van de jueves a miércoles. Se cuenta lo integrado a `develop` dentro de la ventana, que
es lo que la Definition of Done considera terminado.

| Sprint | Período | PRs | Historias entregadas | Puntos |
|---|---|---|---|---|
| **2** | 10 – 16 Sep | 9 | US-003 | 5 |
| **3** | 17 – 23 Sep | 0 | — | 0 |
| **4** | 24 – 30 Sep | 3 | US-002, US-006, US-007, US-008 | 19 |
| **5** | 1 – 7 Oct | 8 | US-001, US-011 a US-021, US-023 a US-025, US-028 a US-031 | 120 |
| **6** | 8 – 14 Oct | 0 | — *(verificación en Staging de las 24)* | 0 |
| **7** | 15 – 21 Oct | 4 | US-017 (flujo 5a), US-032, US-033, US-034 | 26 |

**Total de puntos completados en el período:** 170

### 2.2 Por qué esta distribución no sirve para medir velocidad

**El trabajo no se hizo en el Sprint 5.** Las cuatro épicas se programaron el 16 de septiembre y sus
PRs quedaron abiertos desde entonces. Lo que ocurrió entre el 30 de septiembre y el 3 de octubre fue
la **integración**, no el desarrollo. Como la DoD solo cuenta lo mergeado, los puntos aparecen todos
juntos en una semana y dos sprints quedan en cero.

La consecuencia práctica, que es la que importa para lo que queda de proyecto: **la velocidad por
sprint mide cuándo se mergeó, no cuándo se trabajó.** No se puede usar para planificar mientras no
se integre seguido.

### 2.3 Historias no completadas

| US | Por qué no se completó | ¿Regresa al backlog? |
|---|---|---|
| US-004, US-005 | Nunca se priorizaron; prioridad Media | ☐ Sí ☐ Se congela |
| US-009, US-010 | Nunca se priorizaron; son las más baratas de las siete | ☐ Sí ☐ Se congela |
| US-022 | Depende de un servidor de correo que no existía *(ver §5)* | ☐ Sí ☐ Se congela |
| US-026, US-027 | Nunca se priorizaron; prioridad Media | ☐ Sí ☐ Se congela |

Ninguna es de prioridad Alta, y **los nueve objetivos del enunciado están cubiertos**.

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
   primera firma, **los cupos no bajan**, y el sistema **rechaza** que la segunda firma la dé la
   misma persona
5. **Avisos al estudiante** *(US-034)* — un aviso por cada cambio de estado, con su motivo
6. **Bitácora** *(US-032)* — filtrada por operaciones **rechazadas**, para enseñar que se audita
   también lo que el sistema impide

**Responsable(s) de la demo:** \_\_\_\_\_\_\_\_\_\_\_\_

**Resumen de la demostración:**

`_______________________________________________________________________`

`_______________________________________________________________________`

> **Nota para quien dirija la demo.** El punto 4 es el más difícil de explicar con palabras y el más
> fácil de enseñar: que los cupos **no** bajen con la primera firma es la decisión de diseño que
> mejor se defiende en vivo. Una aprobación a medio terminar no debe apartar un cupo que quizá
> nunca se use. El punto 6 es el segundo: auditar lo que el sistema **impide** es lo que distingue
> una bitácora de un historial.

---

## 4. Feedback de los Stakeholders y del Product Owner

> Registrar los comentarios **textualmente**, sin interpretarlos. Este registro es lo que permite
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

Siguen sin respuesta desde el 16 de septiembre y **afectan a historias ya marcadas como Done**.
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
- [ ] **US-035** — Recuperar la contraseña olvidada por correo *(implementada en el PR #32, pendiente de merge y de registrarse en el backlog)*

**Ítems sugeridos y no implementados:**

- [ ] **Doble factor para cuentas administrativas.** Surgió al revisar las buenas prácticas de
      almacenamiento de contraseñas. Se identificó y **se decidió no hacerlo**: el esfuerzo no cabe
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
| Aprobar y mergear el PR #32 | Fernando | ☐ |
| Verificar US-033 completa en Staging | Isaac y Fernando | ☐ |
| Agregar US-035 al Product Backlog | Isaac | ☐ |
| **Presentación Final** | Equipo | ☐ |
| Mergear `develop` a `main` | Isaac | ☐ |
| Video del patrón State | Isaac | ☐ |
| Cerrar DEF-01, S1-10 y S1-12, o cerrarlos con motivo escrito | Equipo | ☐ |

### Próximas reuniones

- Sprint Retrospective consolidada: hoy, a continuación
- Sesión de preparación de la defensa: \_\_/10/2026

---

**Minuta elaborada por:** \_\_\_\_\_\_\_\_\_\_\_\_ · **Fecha de publicación en el repositorio:** \_\_/10/2026
