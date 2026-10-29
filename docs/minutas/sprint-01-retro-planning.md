# Retrospectiva y Planificación — Sprint 1 → Sprint 2

### Plataforma Nacional para la Gestión Integral de Becas

> **Estado: PREPARADA, no celebrada.** Los datos de calidad (§1.4) y de capacidad (§2.1) son
> **medidos, no estimados**, y se reunieron antes de la reunión para no gastarla averiguándolos.
> Lo que cada integrante aporte en §1.2 y §1.3 se llena durante la reunión del domingo 13:
> poner palabras en boca de alguien que no las dijo invalidaría el ejercicio.

|                 |                                           |
| --------------- | ----------------------------------------- |
| **Fecha**       | 13/09/2026                                |
| **Facilitador** | Isaac (Scrum Master)                      |
| **Asistentes**  | Isaac · Ivan `___` · Fernando `___` · Stuard `___` |

---

# PARTE 1 — SPRINT RETROSPECTIVE

> **Sin el Product Owner.** Se habla del proceso, no del producto.

## 1.1 Seguimiento de la acción de mejora anterior

Es la primera retrospectiva del proyecto: no hay acción anterior que revisar. Sí hay **un riesgo
que el propio Planning del Sprint 1 dejó anotado para revisarse hoy**, y se revisa como si fuera
una acción pendiente.

| Riesgo anotado el 3 de septiembre                                                                        | ¿Se materializó?                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| _"Con estos turnos las parejas quedan fijas. Los code reviews serán siempre entre los mismos."_            | ☑ **Sí, y peor de lo previsto.** No es que los reviews fueran entre los mismos: es que **tres de cinco PRs no tuvieron review**. |
| Mitigación propuesta: _"que el revisor del PR sea alguien de la otra pareja"_                              | ☐ **No se aplicó.** Los revisores se asignaron el mismo día del cierre, no al inicio del sprint.                     |

> Que el riesgo estuviera escrito desde el primer día y aun así se materializara es el dato más
> importante de esta retrospectiva. Anotar un riesgo no lo mitiga. Una mitigación sin
> responsable ni fecha es una intención.

## 1.2 ¿Qué salió bien?

_Cada integrante aporta al menos uno._

| Quién        | Qué salió bien |
| ------------ | -------------- |
| Isaac        | `Los code reviews de Fernando destaparon 4 defectos que yo no había visto, incluyendo una prueba que verificaba el doble de prueba y no el servicio. Eso es exactamente para lo que sirve la revisión.` |
| Ivan         |                |
| Fernando     |                |
| Stuard       |                |

**Datos objetivos que respaldan lo que salió bien:**

- **5 de los 10 defectos del sprint los encontró quien revisaba** (4 Fernando, 1 Stuard), no quien escribió el código. Uno era un criterio de aceptación incumplido y dos eran pruebas que pasaban sin probar lo que decían.
- El flujo de Git funcionó: 5 PRs, ramas por historia, CI en verde, cero conflictos de merge.
- 107 pruebas automatizadas (75 unitarias + 32 de integración) y el linter sin advertencias.

## 1.3 ¿Qué nos estorbó?

_Se critica la situación, no a la persona — Anexo 3, respeto mutuo._

| Quién    | Qué estorbó | ¿Es un impedimento recurrente? |
| -------- | ----------- | ------------------------------ |
| Isaac    | `No tener Staging bloqueó el cierre de TODAS las historias. Y el reparto del trabajo: acabé haciendo tareas de los tres.` | ☑ Sí |
| Ivan     |             | ☐ Sí ☐ No                      |
| Fernando |             | ☐ Sí ☐ No                      |
| Stuard   |             | ☐ Sí ☐ No                      |

**Impedimentos objetivos, con su evidencia:**

| Impedimento                                                            | Evidencia                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Sin entorno de Staging**                                             | Punto 8 de la DoD incumplible → 0 historias completadas de 3 trabajadas                                |
| **Reparto de trabajo muy desigual**                                    | 18 de los 19 commits del repositorio son de un solo integrante                                         |
| **Tres PRs entraron sin code review**                                  | #2 (mergeado por Stuard sin aprobación), #3 y #5 (sin revisor posible distinto del autor)               |
| **Cuatro tareas de revisión no se hicieron**                           | S1-07 y S1-09 sin empezar; S1-08 y S1-10 empezadas y no cerradas                                       |
| **La ceremonia de cierre se perdió**                                   | Review prevista el jueves 10, celebrada el domingo 13. Le costó al Sprint 2 tres de sus siete días     |
| **Las ramas protegidas no existen**                                    | Sin GitHub Pro no se pueden proteger `main` ni `develop`, así que el proceso depende de la memoria      |

### 1.3.1 Sobre el reparto desigual — el punto incómodo

El Anexo 3 §4 compromete al equipo a participación equitativa, y el enunciado del curso la
evalúa. No se cumplió, y no sirve de nada dejarlo implícito:

- Dos integrantes (Fernando y Stuard) entregaron trabajo real: siete comentarios de revisión
  entre ambos que destaparon cinco defectos, un issue de defecto bien documentado, y la corrección
  de una tarjeta mal marcada.
- Ninguno de los dos completó las tareas de revisión documental que había tomado.
- Un integrante (Ivan) no registró actividad en el repositorio durante el sprint, y su área
  —Staging— es justo la que bloqueó el cierre de todo.
- El Scrum Master asumió trabajo de los tres para que el sprint no quedara vacío. **Eso resolvió
  la entrega y agravó el problema de fondo**, porque quitó la consecuencia natural de no entregar.

> El Anexo 3 §6 prevé sanciones progresivas y el equipo eligió las tres. **Esta retrospectiva es la
> "reunión formal del equipo" del primer nivel** para incumplimientos graves: se discute el
> problema y se define un plan de mejora con plazos. Se documenta aquí. No se escala al docente:
> es la primera vez y el paso 1 del Anexo 3 es la conversación directa.

## 1.4 Revisión de calidad

_El QAP establece la retrospectiva como la principal herramienta de auditoría del proceso._
**Datos medidos el 12 de septiembre de 2026 sobre `develop` integrado.**

- ¿Todas las historias marcadas como completadas cumplían realmente el DoD? ☐ Sí ☑ No
  → US-002 estuvo marcada en _Done_ sin cumplir su tercer criterio de aceptación. Lo detectó Stuard revisando, y la tarjeta se corrigió.
- ¿Todos los PR tuvieron code review con comentarios sustantivos? ☐ Sí ☑ No → 2 de 5 lo tuvieron.
- ¿Alguien hizo push directo a `develop` o `main`? ☑ Sí — dos commits de fundación (`d475418`, `6fd6aca`) el 2 de septiembre, antes de que existiera la guía de Git que prohíbe hacerlo. Ninguno después de acordarse el flujo.
- ¿Se escribieron pruebas para todo el código nuevo? ☑ Sí — pero ver el hallazgo de abajo.
- **Cobertura al cierre del sprint: 41.89 %** de sentencias (43.42 % de ramas).
- **Bugs detectados durante el sprint: 10.** 3 documentados del esqueleto + 4 de Fernando revisando + 1 de Stuard revisando + 2 salidos de verificar los diagramas contra el código. 9 corregidos, 1 diferido con decisión escrita.

### 1.4.1 Dos hallazgos de la medición de cobertura

**Primero: el número de 41.89 % está mal medido, y por debajo de la realidad.** El comando
`npm run test:cov` corre solo las pruebas unitarias; las 32 de integración, que son las que
ejercitan controladores y guards, no entran en la medición. El número que reportaríamos al
catedrático sería más bajo que la cobertura real. **Hay que arreglar la medición antes de
perseguir la meta de ≥60 % que el WBS fija para el 21 de octubre**, porque hoy no sabemos contra
qué número estamos trabajando.

**Segundo, y más grave: el único patrón de diseño implementado es el que no tiene ninguna
prueba. Los tres adaptadores del patrón Adapter están a 0 % de cobertura**:

| Archivo                                      | Cobertura | Qué aísla                    |
| -------------------------------------------- | --------- | ---------------------------- |
| `bcrypt-hasher.adapter.ts`                   | **0 %**   | El hashing de contraseñas    |
| `jwt-generador-token.adapter.ts`             | **0 %**   | La emisión del token         |
| `jwt-verificador-token.adapter.ts`           | **0 %**   | La validación de la sesión   |

Las pruebas de integración los sustituyen por dobles, así que el código real de bcrypt y JWT
**nunca se ejecuta en ninguna prueba**. Es el patrón que vamos a presentar como evidencia ante el
catedrático. Se registra como defecto nuevo y entra al Sprint 2.

## 1.5 Acción de mejora para el próximo sprint

> **Una sola acción, concreta y con responsable.**

**Acción:**

> **El revisor de cada Pull Request se asigna en el Planning, no cuando el PR ya está abierto.**
> Queda escrito en el Sprint Backlog, en una columna "Revisor", y siempre es alguien de la pareja
> de turnos contraria al autor. Un PR sin revisor asignado en el Planning no se puede abrir.

**Responsable:** Isaac (Scrum Master) — lo hace cumplir en el Planning
**Cómo sabremos que se cumplió:** al cerrar el Sprint 2, todos los PRs del sprint tienen al
menos una aprobación de alguien distinto de su autor. Se verifica en la próxima retrospectiva
mirando el historial de PRs, no de memoria.

**Por qué esta y no otra:** es la única de todos los problemas de arriba que ataca la causa en vez
del síntoma, no depende de que entre GitHub Pro, y se verifica con un dato objetivo. La protección
de ramas es la mitigación estructural de lo mismo, pero depende de un tercero.

---

# PARTE 2 — SPRINT PLANNING (Sprint 2)

## 2.0 El problema del calendario — se decide antes de estimar

El Sprint 1 cerró el miércoles 9. La Review era el jueves 10 y se celebra el domingo 13. Con la
cadencia de jueves a miércoles, **el Sprint 2 arrancó el jueves 10 y ya lleva tres días corriendo
sin planificarse. Quedan lunes 14, martes 15 y miércoles 16**.

Y hay un agravante: el martes 15 de septiembre es feriado —Día de la Independencia— y es
justo el turno de Ivan e Isaac.

| Opción                                       | Consecuencia                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A. Mantener la cadencia** (Sprint 2 = 10–16) | Sprint de 3 días con 1 feriado. Hay que recortar mucho el alcance, pero **se conservan los 8 sprints**              |
| B. Correr todo una semana                    | Quedan **7 sprints** hasta el 31 de octubre. El Sprint 7 del WBS es el de pruebas y cobertura: se perdería ese colchón |

Los 8 sprints semanales desde el 3 de septiembre terminan el 28 de octubre, tres días antes de
la entrega. No hay semana de holgura que gastar.

**Decisión del equipo:** ☐ A — mantener la cadencia ☐ B — correr una semana
**Recomendación del Scrum Master:** A, y recortar el alcance a lo que de verdad cabe.

## 2.1 Capacidad del equipo

| Integrante | Días de trabajo en este sprint            | Disponibilidad | Notas                                                    |
| ---------- | ----------------------------------------- | -------------- | -------------------------------------------------------- |
| Isaac      | Martes 15 → **movido al domingo 13**      | ☐ Completa ☑ Reducida | El martes es feriado; el domingo se va en las ceremonias |
| Ivan       | Martes 15 → **movido al domingo 13**      | ☐ Completa ☑ Reducida | Igual que Isaac                                          |
| Fernando   | Lunes 14                                  | ☑ Completa     | Único día completo del sprint                            |
| Stuard     | Lunes 14                                  | ☑ Completa     | Único día completo del sprint                            |

**Capacidad total:** ≈4 días-persona _(8 en una semana normal)_ → la mitad
**Velocidad del sprint anterior:** 19 puntos
**Compromiso máximo recomendado:** 8 puntos. La mitad de la capacidad sobre una velocidad de
19 daría ~9; se baja a 8 porque el sprint también carga la deuda de cuatro tareas de revisión sin
cerrar del Sprint 1.

> ⚠️ Los cuatro días-persona no son intercambiables: Fernando y Stuard trabajan el lunes, Isaac e
> Ivan el domingo. Cualquier tarea en la que uno dependa del otro pierde un día entero esperando.
> Por eso los tres ítems comprometidos en §2.3 son independientes entre sí.

## 2.2 Qué pide el WBS para el Sprint 2, y qué ya está entregado

Antes de comprometer nada hay que mirar el cronograma del Acta, porque **el Sprint 1 se adelantó a
buena parte del Sprint 2**:

| WBS  | Tarea del Sprint 2                                | Estado real                                                     |
| ---- | ------------------------------------------------- | --------------------------------------------------------------- |
| 2.1  | Diagrama de casos de uso + detalle de cada caso   | 🟢 **Entregado en el Sprint 1** — faltan 3 detalles (CU-03, CU-13, CU-16) |
| 2.2  | Diagrama de componentes y de clases               | 🟢 **Entregado en el Sprint 1**, y verificado contra el código    |
| 2.3  | Esquema de BD y primera migración versionada      | 🟢 **Entregado** — dos migraciones versionadas en `prisma/migrations/` |
| 2.5  | Requisitos No Funcionales y DoD publicados        | 🟢 **Entregado en el Sprint 1** — Anexo 4 §5 y §6                |
| 2.6  | Guard de autenticación y control de acceso        | 🟢 **Entregado en el Sprint 1** — US-003, con 32 pruebas e2e     |
| 2.4  | Registro, perfil y recuperación de contraseña     | 🔴 **Lo único pendiente** — US-001 (5) + US-004 (3) + US-005 (5) = **13 pts** |

Y hay una tarea de otro sprint que hay que adelantar: 3.3, el entorno de Staging, que el
WBS pone en el Sprint 3. Se adelanta porque mientras no exista, el punto 8 de la DoD es
incumplible y ninguna historia puede cerrarse. Dejarlo en el Sprint 3 significaría acumular
dos sprints enteros de trabajo terminado pero no aceptable.

## 2.3 Sprint Backlog

_Estimar con Planning Poker (1, 2, 3, 5, 8). Responsables por consenso._
**La columna "Revisor" es nueva: es la acción de mejora de §1.5. Se llena aquí, no después.**

### Se compromete — 8 puntos, igual a la capacidad real

| ID         | Historia / Tarea                                               | Pts   | Responsable | **Revisor** | Tareas técnicas                                                                                     |
| ---------- | -------------------------------------------------------------- | ----- | ----------- | ----------- | --------------------------------------------------------------------------------------------------- |
| **S1-13**  | Levantar Staging y verificarlo _(adelantado del WBS 3.3)_       | 5     | Ivan        | Fernando    | `docker build` primero · crear cuenta en Render · conectar el repo · registrar `STAGING_API_URL` · correr el workflow de verificación |
| **DEF-02** | Probar los tres adaptadores del patrón Adapter _(hoy a 0 %)_    | 2     | Fernando    | Isaac       | Pruebas de `bcrypt-hasher`, `jwt-generador-token` y `jwt-verificador-token` con las bibliotecas reales |
| **DEF-03** | Arreglar la medición de cobertura para que incluya las e2e      | 1     | Ivan        | Stuard      | Unificar la configuración de Jest · publicar el número real                                          |
|            | **Total comprometido**                                          | **8** |             |             |                                                                                                     |

**Sprint Goal:** _"Que el Product Owner pueda entrar a la plataforma por su cuenta y aceptar o
rechazar lo que ya está construido."_

Se elige Staging y no funcionalidad nueva por una razón aritmética: sin Staging cada historia
nueva se acumula en un estado "terminada pero no aceptable". Desarrollar más antes de resolverlo
solo agranda la pila. Los otros dos ítems son pequeños y arreglan la evidencia que vamos a
presentar: el patrón Adapter sin pruebas y un número de cobertura mal medido.

### No se compromete — y se dice por qué

| ID / WBS         | Qué es                                             | Destino       | Motivo                                                                       |
| ---------------- | -------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| WBS 2.4 · US-001 | Registro de estudiante (5)                          | **Sprint 3**  | No caben 13 puntos en una capacidad de 8                                     |
| WBS 2.4 · US-004 | Gestión de perfil (3)                               | **Sprint 4**  | Igual                                                                        |
| WBS 2.4 · US-005 | Recuperación de contraseña (5)                      | **Sprint 4**  | Prioridad Baja en el backlog; es la que menos cuesta mover                    |
| US-002           | Bloqueo tras 5 intentos fallidos (3)                | **Sprint 3**  | Cierra US-002. Va junto a US-001 porque tocan el mismo módulo                 |
| S1-07 a S1-10    | Las cuatro revisiones documentales del Sprint 1 (16) | **Sprint 3**  | Deuda declarada. Comprometerlas otra vez sin capacidad es repetir el fallo     |
| CU-03, 13, 16    | Detalle de los tres casos de uso que faltan          | **Sprint 3**  | Completa el WBS 2.1                                                          |

> **Por qué se declara deuda en vez de comprometerla:** el Sprint 1 comprometió 40 puntos y
> completó 19. Comprometer 27 con capacidad para 8 es cómo se llega a una segunda retrospectiva
> idéntica a esta. Es mejor un sprint corto que se cumple que uno largo que se incumple.

### Trabajo documental adelantado — fuera del compromiso

El enunciado exige cuatro documentos que el WBS coloca en los Sprints 7 y 8. **No están
atrasados**, pero se pueden adelantar mientras Staging esté bloqueado, y adelantarlos quita riesgo
del final del proyecto, que es cuando se acumula todo:

| Documento                                   | WBS | Planificado para | Se adelanta a |
| ------------------------------------------- | --- | ---------------- | ------------- |
| Plan de Aseguramiento de Calidad — Anexo 6  | 7.2 | Mié 21 Oct       | Sprint 2      |
| Plan de Pruebas — Anexo 7                   | 7.2 | Mié 21 Oct       | Sprint 2      |
| Manual Técnico                              | 8.1 | Mié 28 Oct       | Sprint 2-3    |
| Manual de Usuario                           | 8.2 | Mié 28 Oct       | Sprint 2-3    |

No entran en el compromiso de 8 puntos porque no son del Sprint 2: se registran como avance
adelantado y sus puntos se acreditan al sprint que el WBS les asigna.

## 2.4 Entregables documentales del sprint

| Documento                                                        | Responsable | Fecha compromiso |
| ---------------------------------------------------------------- | ----------- | ---------------- |
| Minuta de Sprint Review 1                                        | Isaac       | Dom 13 Sep       |
| Minuta de Retrospectiva y Planning 2                             | Isaac       | Dom 13 Sep       |
| `docs/17-staging.md` con el entorno ya levantado y verificado     | Ivan        | Mié 16 Sep       |
| WBS del Acta actualizado con los movimientos de §2.3              | Isaac       | Dom 13 Sep       |

## 2.5 Riesgos y dependencias identificados

| Riesgo / dependencia                                                | Impacto                                                | Mitigación                                                                             | Responsable |
| ------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------- |
| **Staging depende de crear una cuenta externa**                     | Crítico — bloquea la DoD entera                        | Si Ivan no puede el lunes, lo hace Isaac el domingo. No se deja pasar otro sprint       | Ivan / Isaac |
| **El Dockerfile nunca se ha construido**                            | Alto — el despliegue puede fallar al primer intento     | Correr `docker build` antes de conectar Render, no después                              | Ivan        |
| **Martes 15 feriado**                                               | Medio — media capacidad del sprint                     | Ya contabilizado: los turnos se movieron al domingo                                     | —           |
| **Solo 1 de 6 patrones implementado**                               | Alto para la nota final                                | Factory Method (Sprint 3) y State (Sprint 4) según el plan. Verificar avance cada Review | Stuard      |
| **Sin ramas protegidas hasta que entre GitHub Pro**                 | Medio — el proceso depende de la memoria de cada uno    | La acción de mejora de §1.5 no depende de GitHub Pro                                    | Isaac       |
| **El reparto de trabajo vuelve a desequilibrarse**                  | Alto — lo evalúa el enunciado                          | La columna "Revisor" fuerza a los cuatro a tocar el trabajo de los otros                | Isaac       |
| **El feriado del 20 de octubre cae en Sprint 7**, el de pruebas     | Medio                                                  | Anotado ahora para que el Planning del Sprint 7 no lo descubra tarde                     | Isaac       |

## 2.6 Confirmación final

- [ ] Cada integrante confirmó en voz alta qué tomó y para cuándo
- [ ] El tablero de GitHub Projects quedó actualizado
- [ ] Todos entienden el Sprint Goal
- [ ] Las dependencias entre tareas están claras (quién espera a quién)
- [ ] **Cada ítem del Sprint Backlog tiene revisor asignado** _(acción de mejora §1.5)_
- [ ] Se decidió la opción A o B del calendario (§2.0) y se actualizó el WBS del Acta

---

**Próxima Sprint Review:** miércoles 16/09/2026 a las \_\_:\_\_
**Minuta elaborada por:** Isaac Castillo (Scrum Master) · **Preparada el:** 12/09/2026
