# Guion de la Reunión de Arranque — Jueves 3 de septiembre de 2026

> Para Isaac (Scrum Master). Esta es la única reunión del proyecto que no sigue el formato
> normal del jueves, porque no hay Sprint anterior que revisar. Duración objetivo: **2 horas**.
> Ten este archivo abierto y ve marcando.

---

## Antes de que lleguen (10 min)

- [ ] Ten abierto este guion y el archivo `01-acta-constitucion.md`
- [ ] Ten a la mano el PDF del proyecto por si alguien pregunta algo
- [ ] Nombra a alguien que tome notas (que no seas tú — tú estás facilitando)

---

## Bloque 1 — Contexto compartido (15 min)

**Lo que tienes que decir (con tus palabras):**

> "Somos una consultora contratada por el Ministerio de Educación para hacer una plataforma
> de becas. El catedrático es nuestro Product Owner, no nuestro profesor: eso significa que él
> decide qué se construye y en qué orden, y nosotros decidimos cómo.
>
> Lo importante: la nota **no** depende de que el sistema funcione. Depende de la calidad del
> diseño, la arquitectura, que apliquemos SOLID, seis patrones de diseño justificados por
> escrito, pruebas, documentación, y de cómo se vea nuestro repositorio de Git. Eso está
> textual en el PDF.
>
> Y hay una trampa deliberada: el PO va a cambiar los requerimientos a mitad del proyecto.
> Memorandos, cambios de ley, integraciones nuevas. Parte de lo que nos evalúan es cómo
> reaccionamos a eso sin que se nos caiga el diseño."

**Punto clave a dejar claro:** entregamos el **31 de octubre**. Son 8 sprints de una semana.

---

## Bloque 2 — Decisiones que salen de esta reunión (30 min)

Estas cinco cosas **no pueden quedar pendientes**. Sin ellas no arranca el Sprint 1.

### 2.1 Nombre del equipo
Cinco minutos, sin sobrepensarlo. Va en el Acta de Constitución.

**Decisión:** ________________________________

### 2.2 Plataforma única de comunicación
El Anexo 1 exige **una sola**. Recomendación: **Discord** (permite canales separados para
dailies, dudas técnicas y avisos, y el historial es buscable — WhatsApp se vuelve un caos a
las tres semanas).

**Decisión:** ________________________________

**Normas de uso que hay que acordar:**
- Canal `#daily` — cada quien escribe sus 3 líneas en sus días de trabajo
- Canal `#bloqueos` — si algo te traba, va aquí y le llega a Isaac
- Tiempo máximo de respuesta esperado: **12 horas en día hábil**
- Los acuerdos importantes se escriben; lo que no está escrito, no pasó

### 2.3 Confirmar los días de cada quien

| Día | Quiénes |
|---|---|
| Jueves | Los 4 — ceremonias (~2h) |
| Viernes | Isaac + Ivan |
| Sábado | Fernando + Stuard |
| Domingo | libre / buffer |
| Lunes | Isaac + Fernando |
| Martes | Ivan + Stuard |
| Miércoles | Los 4 — cierre asincrónico (~30 min) |

**Pregunta directa a cada uno:** "¿esos dos días te sirven, sí o no?" Si a alguien no le
sirven, se intercambia **ahora**, no en tres semanas.

⚠️ **Avisar desde ya:** el 15 de septiembre y el 20 de octubre son feriados y caen martes —
el turno de Ivan y Stuard. Esas dos semanas ellos mueven su día al domingo.

### 2.4 Confirmar el stack

Propuesta: **NestJS + React + PostgreSQL, todo en TypeScript.**

El argumento a dar: *"Un solo lenguaje en todo el proyecto. Con dos días de trabajo por
persona a la semana, no nos podemos dar el lujo de que alguien quede bloqueado porque no
sabe el lenguaje de la otra mitad del sistema. Además todos tenemos que revisar los PRs de
todos, y eso solo funciona si todos entendemos todo el código."*

Si alguien domina fuerte C# o Java y lo prefiere, es válido — pero se decide **hoy** y no se
vuelve a tocar.

**Decisión:** ________________________________

**Tarea para hoy mismo, los 4:** instalar Node 22, Docker Desktop, Git y VS Code.

### 2.5 Firmar la Política de Trabajo en Grupo

Abrir `02-politica-equipo.md`, leerla en voz alta (son 5 minutos) y **definir juntos las
sanciones** — el Anexo 3 exige que las consensúe el equipo, no que las copien.

La conversación incómoda hay que tenerla hoy: *"¿qué hacemos si alguien no entrega?"* Es
mucho más fácil acordarlo ahora que cuando ya pasó.

---

## Bloque 3 — Visión del Producto (20 min)

Abrir `03-vision-producto.md`. Ya hay un borrador; **léanlo y ajústenlo entre todos**. No lo
escriban desde cero, critíquenlo.

La pregunta que tiene que responder: *¿por qué construimos esto y para quién?*

---

## Bloque 4 — Sprint Planning 1 (40 min)

### Sprint Goal 1

> **"Dejar el equipo constituido, el repositorio funcionando con su flujo de trabajo, y el
> esqueleto técnico del sistema corriendo de punta a punta en la máquina de cada quien."**

Escríbelo tal cual en la minuta. Todo sprint necesita una frase así.

### Historias del Sprint 1

Repasa cada una y **pregunta al equipo quién la toma**. No las asignes tú — el Anexo 3
compromete al equipo a decidir por consenso.

| # | Tarea | Pts | Responsable sugerido |
|---|---|---|---|
| S1-01 | Acta de Constitución completa (Anexo 1) | 3 | Isaac |
| S1-02 | Política de Trabajo firmada por los 4 (Anexo 3) | 2 | Isaac |
| S1-03 | Visión del Producto + 3 User Personas (Anexo 4 §2-3) | 3 | Stuard |
| S1-04 | Product Backlog: 6 epics + ~30 historias con criterios | 8 | Stuard + Isaac |
| S1-05 | Crear repo GitHub, ramas `main`/`develop`, proteger `main` | 3 | Ivan |
| S1-06 | Plantilla de PR + `.gitignore` + README + CI básica | 3 | Ivan |
| S1-07 | Tablero en GitHub Projects con el backlog cargado | 2 | Isaac |
| S1-08 | **Walking skeleton**: API + web + Postgres corriendo local | 8 | Fernando |
| S1-09 | Documento de Arquitectura v1 con justificación (Anexo 5 §2) | 5 | Ivan |
| S1-10 | Definition of Done acordada y publicada | 1 | Todos |

**Total: 38 puntos.** Es mucho para un primer sprint — es normal, este sprint es casi todo
documentación y setup. Si al final del sprint quedan 2 o 3 sin terminar, **no es un fracaso**:
es tu primer dato real de velocidad y con él planificas el Sprint 2.

### Lo que hay que explicar sobre el walking skeleton (S1-08)

Es la tarea más importante del sprint. Fernando construye **un módulo completo de punta a
punta** — base de datos → repositorio → servicio → controlador → pantalla en React. No
importa que sea trivial (que solo liste algo). Lo que importa es que los otros tres tengan
una plantilla que copiar y no tengan que pelearse cada uno con NestJS por su cuenta.

**Sin esto, el Sprint 2 se va a atorar.** Tiene prioridad sobre todo lo demás del código.

---

## Bloque 5 — Cierre (15 min)

- [ ] Cada quien repite en voz alta qué tarea tomó y para cuándo
- [ ] Confirmar que todos entraron al canal de comunicación elegido
- [ ] Confirmar que todos aceptaron la invitación al repositorio
- [ ] Recordar el formato del daily: **qué hice / qué haré / qué me bloquea**
- [ ] Próxima reunión: **jueves 10 de septiembre**, misma hora

**Tarea de Isaac esa misma noche:** llenar la minuta en `docs/minutas/sprint-01-planning.md`
y subirla al repo.

---

## Recordatorios para ti como Scrum Master

- **No eres el jefe.** Facilitas, no mandas. Si alguien propone algo mejor que lo que traías,
  se hace lo mejor.
- **Corta las discusiones largas.** Si un tema lleva más de 5 minutos sin resolverse, se anota
  como pendiente y se sigue. "Buen punto, lo dejo anotado y lo cerramos el viernes."
- **Que hablen todos.** Si alguien lleva 20 minutos callado, pregúntale directamente qué opina.
- **Todo lo que se decide, se escribe.** La minuta es evidencia evaluable.
