# Minuta de Retrospectiva y Planning — Sesión consolidada de los Sprints 2 a 7
### Plataforma Nacional para la Gestión Integral de Becas

> Se celebra a continuación de la
> [Review consolidada](sesion-consolidada-sprints-2-a-7-review.md). Cubre el período del 10 de
> septiembre al 21 de octubre de 2026, y planifica lo que queda hasta la entrega del 31 de octubre.
>
> **Los hechos de la parte 1 están verificados contra el repositorio.** Las conclusiones y las
> decisiones las toma el equipo en la reunión y se escriben durante ella.

| | |
|---|---|
| **Fecha de la Reunión** | \_\_/10/2026 · \_\_:\_\_ a \_\_:\_\_ |
| **Facilitador** | Isaac Castillo (Scrum Master) |
| **Asistentes** | Ivan \_\_\_\_\_\_ · Fernando \_\_\_\_\_\_ · Stuard \_\_\_\_\_\_ |

---

# PARTE 1 · RETROSPECTIVA

## 1.1 Seguimiento de la acción de mejora anterior

La acción de mejora del Sprint 1 fue **celebrar las ceremonias todos los jueves**, según fija
[`02-politica-equipo.md`](../02-politica-equipo.md).

**¿Se cumplió?** ☐ Sí ☒ **No**

**Evidencia:** entre el 13 de septiembre y el 21 de octubre no se celebró ninguna ceremonia. Cinco
sprints seguidos.

> Que la acción de mejora anterior se incumpliera por completo es el dato más importante de esta
> retrospectiva, y conviene no pasar de largo. Una acción de mejora que nadie revisa es una
> intención, no un compromiso. Lo primero que el equipo debería preguntarse es **por qué no se
> revisó**, no por qué no se hizo.

---

## 1.2 ¿Qué salió bien?

Hechos comprobables, no opiniones:

- **Las revisiones de código encontraron cosas de verdad.** Fernando pidió cambios en el PR #13 por
  un posible incumplimiento de US-002. La observación resultó incorrecta —el filtro de excepciones
  ya devolvía un mensaje genérico—, pero destapó que **ninguna prueba fijaba ese comportamiento por
  HTTP**. Se agregó, y se comprobó rompiendo el filtro a propósito para verificar que la prueba
  falla. Una revisión equivocada que mejora el producto vale tanto como una acertada.

- **Desplegar temprano encontró lo que las pruebas no.** Staging reveló dos fallos invisibles en
  local: Render rechaza la clave `plan` en sitios estáticos (PR #21) y la carpeta de documentos no
  existía en la imagen, así que subir un archivo devolvía 500 (PR #22).

- **Un fallo que solo apareció contra PostgreSQL.** Al implementar el criterio 5a de US-017, el
  repositorio guardaba integrantes solo agregando: la respuesta mostraba a la persona fuera, pero
  la fila seguía en la base. Ninguna prueba unitaria lo veía, porque el repositorio en memoria
  guarda la misma instancia. Lo encontró una prueba de humo contra la base real.

- **Se superó el mínimo de patrones.** El enunciado exige 6 y se implementaron **8**, cada uno con
  su justificación técnica y sus pruebas.

- **La cobertura se mantuvo alta sin que nadie la persiguiera:** 91.83 % de sentencias.

**Lo que el equipo quiera añadir en la sesión:**

- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## 1.3 ¿Qué nos estorbó?

- **Cinco sprints sin ceremonias.** Es el hecho principal. El enunciado evalúa de forma explícita
  "trabajar colaborativamente mediante Scrum", y un proyecto que entrega mucho sin inspeccionar ni
  adaptarse no está haciendo Scrum: está haciendo trabajo por lotes con un tablero al lado.

- **Integración en lote.** Nueve PRs abiertos a la vez, encadenados uno sobre otro. Cada merge
  obligaba a actualizar el siguiente, y cada actualización descartaba la aprobación ya dada, así
  que los revisores tuvieron que aprobar dos y tres veces lo mismo.

- **Una semana perdida esperando una aprobación.** El PR #13 estuvo bloqueado del 23 al 30 de
  septiembre por una revisión con cambios solicitados que nadie retomó. Bloqueaba a los ocho PRs
  siguientes. Es la causa directa de que el Sprint 3 cerrara en cero.

- **El tablero estuvo filtrado por "Sprint 1" durante semanas**, así que el Proxy PO no veía las
  tarjetas de las historias y creía que no existían.

- **El campo Sprint del tablero dice dónde se planificó cada historia, no dónde se entregó**, así
  que hoy el tablero cuenta una historia distinta de la real.

- **Credenciales de administrador visibles en el login desplegado.** Estuvieron a la vista de
  cualquiera desde el 4 hasta el 22 de octubre (PR #28). La contraseña de Staging **sigue sin
  cambiarse** a la fecha de esta sesión.

---

## 1.4 Revisión de calidad

| Indicador | Valor | Comentario |
|---|---|---|
| Pruebas totales | 675 | 504 unitarias, 171 de integración |
| Cobertura de sentencias | 91.83 % | Medida el 17 Oct |
| PRs sin revisión | 0 | Todos aprobados por otro integrante |
| Defectos encontrados por personas, no por pruebas | **4** | Ver abajo |

### El hallazgo de calidad de esta retrospectiva

Cuatro defectos los encontró **alguien usando la aplicación**, no la suite de pruebas:

| Defecto | Cómo se encontró | PR |
|---|---|---|
| Integrantes del comité que no se quitaban de la base | Prueba de humo contra PostgreSQL | #24 |
| El monto de la beca no se guardaba, y la doble aprobación nunca ocurría | Verificando en Staging | #30 |
| Cuatro fallos de sesión, dictámenes y cupos | Verificando en Staging | #31 |
| El botón de la segunda firma no se podía habilitar nunca | Verificando en Staging | #32 |

**El patrón es claro y vale la pena nombrarlo:** las pruebas e2e llaman a la API directamente, sin
pasar por la interfaz, y **`apps/web` no tiene ninguna prueba automática**. Los cuatro defectos son
invisibles para la suite tal como está escrita hoy.

El tercero es el más instructivo: la doble aprobación de US-033 estaba correctamente implementada
en el backend —159 pruebas la recorrían— y aun así **ningún administrador podía ejecutarla con el
ratón**, porque el campo obligatorio no se dibujaba. Una funcionalidad probada, desplegada e
inalcanzable.

**Conclusión que el equipo debe discutir:** tener 675 pruebas no es lo mismo que tener el producto
probado. La pirámide de pruebas del
[Plan de Pruebas](../19-plan-pruebas.md) tiene el nivel 3 vacío.

---

## 1.5 Acción de mejora

> Una sola, medible, y con alguien que la revise. La del Sprint 1 falló porque nadie la revisó.

**Acción acordada:**

`_______________________________________________________________________`

**Cómo se comprueba que se cumplió:**

`_______________________________________________________________________`

**Quién la revisa y cuándo:** \_\_\_\_\_\_\_\_\_\_\_\_

**Sugerencia del Scrum Master, a discutir:** antes de dar por terminada cualquier historia que
tenga pantalla, **alguien distinto de quien la programó tiene que ejecutarla en Staging con el
ratón**. Es la única de las cuatro causas de arriba que se puede cerrar en los días que quedan sin
escribir una sola prueba nueva.

---

# PARTE 2 · PLANNING DEL TRAMO FINAL

## 2.1 Capacidad del equipo

**Período:** del \_\_/10/2026 al **31 de octubre de 2026** *(entrega)*

| Integrante | Días disponibles | Observaciones |
|---|---|---|
| Isaac | | |
| Ivan | | |
| Fernando | | |
| Stuard | | |

> Quedan cuatro días. No es un sprint: es un cierre. La capacidad real debe contarse en horas, no
> en días, y conviene hacerlo en voz alta antes de comprometer nada.

---

## 2.2 Objetivo del tramo final

**Propuesta:** *"Cerrar el proyecto entregable: todo lo construido verificado en Staging, toda la
documentación al día, y la Presentación Final lista para defender."*

**Objetivo acordado:**

`_______________________________________________________________________`

> Nótese que el objetivo **no incluye construir funcionalidad nueva**. Con cuatro días, cada
> historia que se empiece compite con la presentación, que es un entregable obligatorio y está sin
> empezar.

---

## 2.3 Backlog del tramo final

Ordenado por lo que más daña si no se hace:

| # | Tarea | Responsable | Estimación | Estado |
|---|---|---|---|---|
| 1 | Aprobar y mergear el PR #32 | Fernando | 30 min | ☐ |
| 2 | Verificar US-033 completa en Staging, con capturas | Isaac + Fernando | 1 h | ☐ |
| 3 | **Presentación Final** | Equipo | 1 día | ☐ |
| 4 | Agregar US-035 al Product Backlog | Isaac | 30 min | ☐ |
| 5 | Mergear `develop` a `main` *(va 102 commits por detrás)* | Isaac | 30 min | ☐ |
| 6 | Cambiar la contraseña de Staging en Render | Isaac | 15 min | ☐ |
| 7 | Volver a medir la cobertura y actualizar los documentos | Isaac | 30 min | ☐ |
| 8 | Video del patrón State *(guion listo desde el 18 Sep)* | Isaac | 1 h | ☐ |
| 9 | Cerrar DEF-01, S1-10 y S1-12, o cerrarlos con motivo escrito | Equipo | 30 min | ☐ |
| 10 | Ensayo de la defensa | Equipo | 2 h | ☐ |

**Lo que el equipo decide NO hacer:**

- ☐ Las siete historias pendientes *(ninguna es de prioridad Alta)*
- ☐ El doble factor para cuentas administrativas
- ☐ Verificar el envío de correo por SMTP real

> Escribir lo que no se va a hacer es tan importante como escribir lo que sí. Un alcance declarado
> se defiende; un alcance incompleto sin declarar parece un olvido.

---

## 2.4 Riesgos del tramo final

| Riesgo | Impacto | Mitigación | Responsable |
|---|---|---|---|
| La Presentación Final no se empieza a tiempo | **Alto** — es entregable obligatorio | Bloquear un día completo para ella | Equipo |
| `main` se queda 102 commits por detrás | **Alto** — quien clone el repositorio no ve el proyecto | Mergear antes del 30 | Isaac |
| El PR #32 no se aprueba y US-033 no se puede verificar | Medio | Revisarlo hoy mismo | Fernando |
| La contraseña de Staging sigue expuesta | Medio | Cambiarla en Render | Isaac |
| Nadie ensaya la defensa | Medio | Agendar el ensayo ahora, no "cuando se pueda" | Equipo |

---

## 2.5 Confirmación final

**¿El equipo se compromete con este cierre?** ☐ Sí ☐ Con ajustes

**Ajustes acordados:**

`_______________________________________________________________________`

---

**Minuta elaborada por:** \_\_\_\_\_\_\_\_\_\_\_\_ · **Publicada en el repositorio el:** \_\_/10/2026
