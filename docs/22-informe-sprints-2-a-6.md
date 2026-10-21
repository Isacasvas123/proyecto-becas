# Informe de los Sprints 2 a 6 — insumo para la sesión consolidada

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Elaborado por** | Isaac Castillo (Scrum Master) |
| **Fecha** | 17 de octubre de 2026 |
| **Para** | La Review y la Retrospectiva consolidadas de los Sprints 2 a 6 |

> **Qué es este documento y qué no es.**
>
> **Es** un informe de hechos: todo lo que contiene está sacado del repositorio, del tablero y de
> Render —fechas de merge, números de PR, quién aprobó cada revisión, pruebas, cobertura—, no de
> la memoria de nadie.
>
> **No es** una minuta. Las minutas registran lo que se dijo en una reunión, y **las ceremonias de
> los Sprints 2 a 6 no se celebraron**. Escribirlas ahora sería inventar reuniones. Este informe
> existe para que el equipo pueda celebrar **una** sesión consolidada con los datos sobre la mesa,
> y de esa sesión sí salga una minuta verdadera, fechada el día que ocurra.

---

## 1. Lo primero que hay que reconocer

Entre el 10 de septiembre y el 15 de octubre el equipo entregó 24 historias, los seis patrones
exigidos y el entorno de Staging. En el mismo período **no se celebró ninguna ceremonia**: ni
Review, ni Retrospectiva, ni Planning. La última documentada es la del Sprint 1, del 13 de
septiembre.

Esto no es un detalle administrativo. La política del equipo (`02-politica-equipo.md`) fija
ceremonias todos los jueves, y el enunciado evalúa de forma explícita la capacidad de "trabajar
colaborativamente mediante Scrum". Un proyecto que entrega mucho sin inspeccionar ni adaptarse no
está haciendo Scrum: está haciendo trabajo por lotes con un tablero al lado.

El propósito de la sesión consolidada es cerrar ese hueco a tiempo y dejar constancia honesta de
lo que pasó.

---

## 2. Qué se entregó en cada sprint

Los sprints van de jueves a miércoles. La columna "entregado" cuenta lo que **se integró a
`develop`** dentro de esa ventana, que es lo que la Definition of Done considera terminado.

| Sprint | Período | PRs | Historias entregadas | Puntos |
|---|---|---|---|---|
| **2** | 10 – 16 Sep | 9 | US-003 | 5 |
| **3** | 17 – 23 Sep | 0 | — | 0 |
| **4** | 24 – 30 Sep | 3 | US-002, US-006, US-007, US-008 | 19 |
| **5** | 1 – 7 Oct | 8 | US-001, US-011 a US-021, US-023 a US-025, US-028 a US-031 | 120 |
| **6** | 8 – 14 Oct | 0 | — (verificación en Staging de las 24) | 0 |
| **7** | 15 – 21 Oct | 2 | US-017 completada (flujo 5a) | 5 |

### 2.1 Por qué esa distribución es engañosa

**El trabajo no se hizo en el Sprint 5.** Las cuatro épicas se programaron el 16 de septiembre y
sus PRs quedaron abiertos desde entonces. Lo que ocurrió entre el 30 de septiembre y el 3 de
octubre fue la **integración**, no el desarrollo. Como la DoD solo cuenta lo mergeado, los puntos
aparecen todos juntos en una semana y dos sprints quedan en cero.

La consecuencia práctica es que **la velocidad por sprint no sirve para planificar** en este
proyecto: mide cuándo se mergeó, no cuándo se trabajó. Si el equipo quiere usarla en lo que queda,
primero tiene que integrar seguido.

### 2.2 Detalle de los PRs

| PR | Mergeado | Qué entró |
|---|---|---|
| #1, #3, #4, #5, #7, #8, #9, #10, #11 | 12 Sep | Walking skeleton, rediseño del portal, US-003, documentación del Sprint 1, Staging como código, ceremonias del Sprint 1, Anexos 6 y 7, manuales, detalle de casos de uso |
| #13, #14, #15 | 30 Sep | Bloqueo tras 5 intentos (US-002), convocatorias con Factory Method (US-006 a US-008), corrección de URLs de Staging |
| #16, #17, #18, #19, #20 | 1 – 3 Oct | Registro (US-001) y las cuatro épicas: solicitudes con **State**, evaluación con **Strategy**, resolución con **Facade**, reportes con **Builder** |
| #12 | 3 Oct | Cobertura real y pruebas del patrón Adapter (DEF-02 y DEF-03) |
| #21, #22 | 3 – 4 Oct | Dos fallos que solo aparecieron al desplegar |
| #23, #24 | 15 Oct | Documentación de la verificación y el criterio 5a de US-017 |

---

## 3. Estado del producto hoy

| Indicador | Valor |
|---|---|
| Historias en Done | **24 de 31** |
| Objetivos del enunciado cubiertos | **9 de 9** |
| Patrones implementados y probados | **6 de 6** (Adapter, Factory Method, State, Strategy, Facade, Builder) |
| Pruebas | **597** en total: 461 unitarias y 136 de integración |
| Cobertura de sentencias | **91.83 %** (ramas 82.33 %), medida el 17 de octubre |
| PRs mergeados | 24, todos con revisión aprobada por otro integrante |
| Staging | En línea desde el 4 de octubre, verificado por workflow |

Historias pendientes, ninguna de prioridad Alta: US-004, US-005, US-009, US-010, US-022, US-026 y
US-027.

---

## 4. Hechos para la Retrospectiva

No son conclusiones: son cosas comprobables que pasaron. Las conclusiones las saca el equipo en la
reunión.

**Lo que funcionó**

- **Las revisiones encontraron cosas de verdad.** Fernando pidió cambios en el PR #13 por un
  posible incumplimiento de US-002. La observación resultó incorrecta —el filtro de excepciones ya
  devolvía un mensaje genérico—, pero destapó que **ninguna prueba fijaba ese comportamiento por
  HTTP**. Se agregó, y se verificó rompiendo el filtro a propósito para comprobar que la prueba
  falla.
- **Desplegar temprano encontró lo que las pruebas no.** Staging reveló dos fallos invisibles en
  local: Render rechaza la clave `plan` en sitios estáticos (PR #21) y la carpeta de documentos no
  existía en la imagen, así que subir un archivo devolvía 500 (PR #22).
- **Un fallo que solo apareció contra PostgreSQL.** Al implementar el criterio 5a de US-017, el
  repositorio guardaba integrantes solo agregando: la respuesta mostraba a la persona fuera, pero
  la fila seguía en la base. Ninguna prueba unitaria lo veía, porque el repositorio en memoria
  guarda la misma instancia. Lo encontró una prueba de humo contra la base real.

**Lo que no funcionó**

- **Cinco sprints sin ceremonias.** Es el hecho principal de esta retrospectiva.
- **Integración en lote.** Nueve PRs abiertos a la vez, encadenados uno sobre otro. Cada merge
  obligaba a actualizar el siguiente, y cada actualización descartaba la aprobación ya dada, así
  que los revisores tuvieron que aprobar dos y tres veces lo mismo.
- **Una semana perdida esperando una aprobación.** El PR #13 estuvo bloqueado del 23 al 30 de
  septiembre por una revisión con cambios solicitados que nadie retomó. Bloqueaba a los ocho PRs
  siguientes.
- **El tablero estuvo filtrado por "Sprint 1" durante semanas**, así que el Proxy PO no veía las
  tarjetas de las historias y creía que no existían.
- **El campo Sprint del tablero dice dónde se planificó cada historia, no dónde se entregó.** Hoy
  el tablero cuenta una historia distinta de la real.

---

## 5. Decisiones que el equipo debe tomar en la sesión

1. **¿Se retoman las ceremonias** para los Sprints 7 y 8, o se declara formalmente que el proyecto
   pasó a un modo distinto y se documenta así?
2. **¿Se corrige el campo Sprint del tablero** para que refleje la entrega real, o se deja como
   registro de la planificación y se explica en la Review?
3. **¿Qué se hace con las 7 historias pendientes?** Con dos semanas para la entrega, ¿se intenta
   alguna (US-009 y US-010 son las más baratas) o se congelan y se declara el alcance?
4. **¿Quién graba el video del patrón State** y para cuándo. El guion está listo desde el 18 de
   septiembre.
5. **DEF-01** sigue abierto, y las tarjetas S1-10 y S1-12 llevan un mes en *In Progress*.

---

## 6. Preguntas pendientes para el Product Owner

Siguen sin respuesta desde el 16 de septiembre y afectan a una historia ya marcada como Done:

1. **¿Acepta las fórmulas de puntaje?** Mérito = promedio del estudiante. Necesidad = 100 puntos si
   el ingreso por persona es de Q500 o menos, 0 si es de Q5,000 o más, proporcional en medio. Beca
   universitaria: 60 % mérito y 40 % necesidad. Nivel medio y posgrado: solo mérito.
2. **¿Se confirma el tope de 50 cupos** en las convocatorias de posgrado?

---

## 7. Qué falta para el 31 de octubre

| Pendiente | Responsable sugerido | Observación |
|---|---|---|
| Minuta de la sesión consolidada | Isaac | Sale de la reunión para la que sirve este informe |
| Video del patrón State | Isaac | Guion listo; faltan 5 minutos de grabación |
| Presentación Final | Equipo | Entregable del enunciado, aún sin empezar |
| Verificar en Staging el criterio 5a de US-017 | Stuard | Se implementó después de su verificación |
| Cerrar DEF-01, S1-10 y S1-12 | Equipo | O hacerlos, o cerrarlos con motivo escrito |
| Decidir el alcance final | Proxy PO | Las 7 historias pendientes |

---

*Los datos de este informe se pueden reproducir con `gh pr list`, `git log` y el tablero del
proyecto. La cobertura, con `npm run test:cov`.*
