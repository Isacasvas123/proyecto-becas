# Minuta de Retrospectiva y Planning — Sesión consolidada de los Sprints 2 a 7
### Plataforma Nacional para la Gestión Integral de Becas

> Se celebra a continuación de la
> [Review consolidada](sesion-consolidada-sprints-2-a-7-review.md). Cubre el período del 10 de
> septiembre al 21 de octubre de 2026, y planifica lo que queda hasta la entrega del 31 de octubre.
>
> Los datos de la parte 1 están tomados del repositorio y del tablero.

| | |
|---|---|
| **Fecha de la Reunión** | martes 27/10/2026 · 20:15 a 21:30 |
| **Facilitador** | Isaac Castillo (Scrum Master) |
| **Asistentes** | Isaac · Ivan · Fernando · Stuard (los cuatro presentes) |

---

# PARTE 1 · RETROSPECTIVA

## 1.1 Seguimiento de la acción de mejora anterior

La acción de mejora del Sprint 1 fue celebrar las ceremonias todos los jueves, según fija
[`02-politica-equipo.md`](../02-politica-equipo.md).

**¿Se cumplió?** ☐ Sí ☒ No

**Evidencia:** las ceremonias de los Sprints 2 a 7 no se celebraron en su fecha semanal. El equipo
las agrupó en la sesión consolidada que recogen esta minuta y la Review que la precede.

> La acción se mantiene para el tramo final, esta vez con un responsable designado de verificar su
> cumplimiento al cierre de cada sprint.

---

## 1.2 ¿Qué salió bien?

Hechos comprobables, no opiniones:

- **Las revisiones de código encontraron cosas de verdad.** Fernando pidió cambios en el PR #13 por
  un posible incumplimiento de US-002. La observación resultó incorrecta —el filtro de excepciones
  ya devolvía un mensaje genérico—, pero destapó que **ninguna prueba fijaba ese comportamiento por
  HTTP**. Se agregó, y se comprobó rompiendo el filtro a propósito para verificar que la prueba
  falla. La observación, aun siendo incorrecta, derivó en una mejora verificable del producto.

- **Desplegar temprano encontró lo que las pruebas no.** Staging reveló dos fallos invisibles en
  local: Render rechaza la clave `plan` en sitios estáticos (PR #21) y la carpeta de documentos no
  existía en la imagen, así que subir un archivo devolvía 500 (PR #22).

- **Un fallo que solo apareció contra PostgreSQL.** Al implementar el criterio 5a de US-017, el
  repositorio guardaba integrantes solo agregando: la respuesta mostraba a la persona fuera, pero
  la fila seguía en la base. Ninguna prueba unitaria lo veía, porque el repositorio en memoria
  guarda la misma instancia. Lo encontró una prueba de humo contra la base real.

- **Se superó el mínimo de patrones.** El enunciado exige 6 y se implementaron 7, cada uno con
  su justificación técnica y sus pruebas.

- **La cobertura se mantuvo alta sin que nadie la persiguiera:** 91.83 % de sentencias.

**Lo que el equipo quiera añadir en la sesión:**

- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## 1.3 ¿Qué nos estorbó?

- **Ceremonias agrupadas.** Las revisiones y retrospectivas de los Sprints 2 a 7 se concentraron en
  una sola sesión al cierre del período, en lugar de celebrarse al final de cada sprint. El equipo
  perdió con ello la posibilidad de corregir el rumbo semana a semana.

- **Integración en lote.** Nueve PRs abiertos a la vez, encadenados uno sobre otro. Cada merge
  obligaba a actualizar el siguiente, y cada actualización descartaba la aprobación ya dada, así
  que los revisores tuvieron que aprobar dos y tres veces lo mismo.

- **Una semana perdida esperando una aprobación.** El PR #13 estuvo bloqueado del 23 al 30 de
  septiembre por una revisión con cambios solicitados que nadie retomó, y con él los ocho Pull
  Requests encadenados detrás.

- **El tablero estuvo filtrado por "Sprint 1" durante varias semanas**, de modo que el Proxy
  Product Owner no veía las tarjetas de las historias en curso.

- **Credenciales de administrador visibles en el login desplegado.** Estuvieron a la vista de
  cualquiera desde el 4 hasta el 22 de octubre (PR #28). La contraseña de Staging **sigue sin
  cambiarse** a la fecha de esta sesión.

---

## 1.4 Revisión de calidad

| Indicador | Valor | Comentario |
|---|---|---|
| Pruebas totales | 675 | 504 unitarias, 171 de integración |
| Cobertura de sentencias | 91.83 % | Medida el 17 Oct |
| PRs sin aprobación | 8 | Los ocho son anteriores al PR #12; desde entonces, ninguno |
| Defectos encontrados por personas, no por pruebas | **4** | Ver abajo |

### Defectos detectados fuera de la suite de pruebas

Cuatro defectos los encontró alguien usando la aplicación, no la suite de pruebas:

| Defecto | Cómo se encontró | PR |
|---|---|---|
| Integrantes del comité que no se quitaban de la base | Prueba de humo contra PostgreSQL | #24 |
| El monto de la beca no se guardaba, y la doble aprobación nunca ocurría | Verificando en Staging | #30 |
| Cuatro fallos de sesión, dictámenes y cupos | Verificando en Staging | #31 |
| El botón de la segunda firma no se podía habilitar nunca | Verificando en Staging | #34 |

Los cuatro comparten una misma causa: las pruebas de integración llaman a la API directamente, sin
pasar por la interfaz, y `apps/web` no cuenta con pruebas automáticas. Ninguno de los cuatro podía
detectarse con la suite tal como está escrita.

El caso de US-033 ilustra el alcance del problema. La doble aprobación estaba correctamente
implementada en el backend y cubierta por 159 pruebas, pero el campo obligatorio no se dibujaba en
la pantalla y ningún administrador podía completar la operación desde la interfaz.

El nivel 3 de la pirámide del [Plan de Pruebas](../19-plan-pruebas.md) —pruebas de sistema sobre la
interfaz— permanece sin cubrir.

---

## 1.5 Acción de mejora

> Una sola acción, medible y con responsable de verificarla al cierre del sprint.

**Acción acordada:**

Antes de cerrar una historia con interfaz, un integrante distinto de quien la programó la ejecuta
en Staging y deja una captura en el Pull Request.

**Cómo se comprueba que se cumplió:**

Cada Pull Request con cambios de interfaz del tramo final tiene un comentario de otro integrante con
la captura de la prueba en Staging.

**Quién la revisa y cuándo:** Isaac, al cierre del 28 de octubre

**Propuesta del Scrum Master:** antes de dar por terminada una historia con interfaz, un integrante
distinto de quien la programó debe ejecutarla en Staging y dejar constancia. Es la medida que puede
adoptarse de inmediato sin ampliar la suite de pruebas.

---

# PARTE 2 · PLANNING DEL TRAMO FINAL

## 2.1 Capacidad del equipo

**Período:** del 27/10/2026 al 31 de octubre de 2026 *(entrega)*

| Integrante | Días disponibles | Observaciones |
|---|---|---|
| Isaac | 4 días, unas 3 horas por día | Presentación Final, documentación y merges a `develop` y `main` |
| Ivan | 3 días | Verificación del despliegue en Staging y limpieza de la configuración |
| Fernando | 3 días | Revisión del PR #34 y pruebas de persistencia pendientes (DEF-01) |
| Stuard | 3 días | Manual de Usuario al día y guion de la demostración |

> Quedan cuatro días. No es un sprint: es un cierre. La capacidad real debe contarse en horas, no
> en días, y debe acordarse antes de comprometer el alcance.

---

## 2.2 Objetivo del tramo final

**Propuesta:** *"Cerrar el proyecto entregable: todo lo construido verificado en Staging, toda la
documentación al día, y la Presentación Final lista para defender."*

**Objetivo acordado:**

Cerrar el proyecto entregable: todo lo construido verificado en Staging, toda la documentación al
día y la Presentación Final lista para defender. Se adopta la propuesta sin cambios.

> El objetivo no incluye construir funcionalidad nueva. Con cuatro días, cada
> historia que se empiece compite con la presentación, que es un entregable obligatorio y está sin
> empezar.

---

## 2.3 Backlog del tramo final

Ordenado por lo que más daña si no se hace:

| # | Tarea | Responsable | Estimación | Estado |
|---|---|---|---|---|
| 1 | Aprobar y mergear el PR #32 | Fernando | 30 min | ☒ Hecho el 28 Oct · se reabrió como **PR #34** |
| 2 | Verificar US-033 completa en Staging, con capturas | Isaac + Fernando | 1 h | ☒ Hecho el 27 Oct · 20 capturas, con dos administradores |
| 3 | **Presentación Final** | Equipo | 1 día | ☐ |
| 4 | Agregar US-035 al Product Backlog | Isaac | 30 min | ☒ Hecho |
| 5 | Mergear `develop` a `main` *(va 102 commits por detrás)* | Isaac | 30 min | ☒ Hecho el 28 Oct · **PR #36** |
| 6 | Cambiar la contraseña de Staging en Render | Isaac | 15 min | ☐ |
| 7 | Volver a medir la cobertura y actualizar los documentos | Isaac | 30 min | ☐ |
| 8 | Video del patrón State *(guion listo desde el 18 Sep)* | Isaac | 1 h | ☐ |
| 9 | Cerrar DEF-01, S1-10 y S1-12, o cerrarlos con motivo escrito | Equipo | 30 min | 🟡 S1-10 y S1-12 cerradas · DEF-01 sigue abierta |
| 10 | Ensayo de la defensa | Equipo | 2 h | ☐ |

**Lo que el equipo decide NO hacer:**

- ☒ Las siete historias pendientes *(ninguna es de prioridad Alta)*
- ☒ El doble factor para cuentas administrativas
- ☒ Verificar el envío de correo por SMTP real

> El alcance excluido se declara de forma expresa para que quede constancia de que fue evaluado y
> descartado, y no omitido.

---

## 2.4 Riesgos del tramo final

| Riesgo | Impacto | Mitigación | Responsable |
|---|---|---|---|
| La Presentación Final no se empieza a tiempo | **Alto** — es entregable obligatorio | Bloquear un día completo para ella | Equipo |
| `main` se queda 102 commits por detrás | **Alto** — quien clone el repositorio no ve el proyecto | Mergear antes del 30 | Isaac |
| El PR #32 no se aprueba y US-033 no se puede verificar | Medio | Revisarlo hoy mismo | Fernando |
| La contraseña de Staging sigue expuesta | Medio | Cambiarla en Render | Isaac |
| Nadie ensaya la defensa | Medio | Agendar el ensayo ahora, no "cuando se pueda" | Equipo |

> **Al 28 de octubre**, de estos cinco riesgos quedan vivos dos: la contraseña de Staging, que sigue
> sin cambiarse, y el ensayo de la defensa. Los otros tres se cerraron: la Presentación Final ya está
> armada, `main` se actualizó con el PR #36 y el PR #32 se aprobó.

---

## 2.5 Confirmación final

**¿El equipo se compromete con este cierre?** ☐ Sí ☒ Con ajustes

**Ajustes acordados:**

La Presentación Final sube al primer lugar del backlog del cierre, por encima de los merges, y el
ensayo de la defensa se fija para el viernes 30 de octubre con los cuatro integrantes.

---

**Minuta elaborada por:** Isaac Castillo (Scrum Master) · **Publicada en el repositorio el:** 28/10/2026
