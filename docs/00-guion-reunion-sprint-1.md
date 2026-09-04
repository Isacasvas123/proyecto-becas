# Guion de la Reunión de Arranque — Jueves 3 de septiembre de 2026

> Para Isaac (Scrum Master). Es la única reunión del proyecto que no sigue el formato normal
> del jueves, porque no hay Sprint anterior que revisar. Duración objetivo: **2 horas**.
> El Product Owner (Ing. Fuentes) no asiste: es una reunión interna del equipo.

---

## Antes de que lleguen (10 min)

- [ ] Ten este guion abierto y el archivo `01-acta-constitucion.md` a la mano
- [ ] **Levanta la aplicación** para poder enseñarla: `docker compose up -d` y luego `npm run dev`
- [ ] Verifica que abre en `http://localhost:5173` y que entras con `admin` / `EC321`
- [ ] Nombra a alguien que tome notas — que no seas tú, tú estás facilitando

---

## Bloque 1 — Contexto compartido (15 min)

**Lo que tienes que decir, con tus palabras:**

> "Somos una consultora contratada por el Ministerio de Educación para hacer una plataforma
> de becas. El catedrático es nuestro **Product Owner**, no nuestro profesor: él decide qué se
> construye y en qué orden, nosotros decidimos cómo.
>
> Lo importante: la nota **no** depende de que el sistema funcione. Depende de la calidad del
> diseño, la arquitectura, que apliquemos SOLID, seis patrones de diseño justificados por
> escrito, pruebas, documentación y de cómo se vea nuestro repositorio de Git. Eso está textual
> en el enunciado.
>
> Y hay una trampa deliberada: el PO va a cambiar los requerimientos a mitad del proyecto.
> Parte de lo que nos evalúan es cómo reaccionamos sin que se nos caiga el diseño."

**Fecha clave:** entregamos el **31 de octubre**. Son **8 sprints de una semana**.

---

## Bloque 2 — Decisiones que salen de esta reunión (30 min)

Estas seis cosas **no pueden quedar pendientes**.

### 2.1 Nombre del equipo
Cinco minutos, sin sobrepensarlo. Va en el Acta de Constitución.

**Decisión:** `_______________________________`

### 2.2 Plataforma única de comunicación
El Anexo 1 exige **una sola**. Recomendación: **Discord** — permite canales separados y el
historial es buscable; WhatsApp se vuelve un caos a las tres semanas.

**Decisión:** `_______________________________`

Normas a acordar:
- `#daily` — cada quien escribe tres líneas en sus días de trabajo: qué hice, qué haré, qué me bloquea
- `#bloqueos` — impedimentos que requieren acción del Scrum Master ese mismo día
- Tiempo máximo de respuesta: **12 horas en día hábil**
- Lo que no está escrito, no pasó

### 2.3 ⚠️ Cuentas de GitHub — HAZLO AHORA, EN LA REUNIÓN

**Este es el punto que más riesgo tiene de trabar el sprint.** Ninguno de los tres tiene todavía
acceso al repositorio.

Que **cada uno, en ese momento**, cree su cuenta en github.com si no la tiene, y te dicte su
nombre de usuario. No lo dejes para "me lo pasas luego".

| Integrante | Usuario de GitHub |
|---|---|
| Ivan | `________________` |
| Fernando | `________________` |
| Stuard | `________________` |

Isaac los invita ahí mismo desde **Settings → Collaborators** del repositorio, y cada uno acepta
la invitación que le llega al correo antes de que termine la reunión.

### 2.4 Confirmar los días de cada quien

| Día | Quiénes |
|---|---|
| **Jueves** | Los 4 — ceremonias (~2 h) |
| Viernes | Isaac + Ivan |
| Sábado | Fernando + Stuard |
| Domingo | Libre / buffer |
| Lunes | Isaac + Fernando |
| Martes | Ivan + Stuard |
| **Miércoles** | Los 4 — cierre asincrónico (~30 min) |

Pregunta a cada uno: *"¿esos dos días te sirven, sí o no?"* Si a alguien no le sirven, se
intercambia **ahora**, no en tres semanas.

⚠️ **Avísales desde ya:** el **15 de septiembre** y el **20 de octubre** son feriados y caen
martes — el turno de Ivan y Stuard. Esas dos semanas mueven su día al domingo.

### 2.5 Firmar la Política de Trabajo en Grupo

Abrir `02-politica-equipo.md`, leerla en voz alta (5 minutos) y **definir juntos las sanciones**:
el Anexo 3 exige que las consensúe el equipo, no que las copien.

La conversación incómoda hay que tenerla hoy: *"¿qué hacemos si alguien no entrega?"* Es mucho
más fácil acordarlo ahora que cuando ya pasó.

### 2.6 Designar al Proxy Product Owner

**El problema que resuelve:** el catedrático es el Product Owner —así lo exige el enunciado— pero
no va a estar revisando el proyecto todos los días. Alguien tiene que decir "esta historia cumple
lo que dice el backlog" sin esperar a la siguiente clase.

**La propuesta:** **Stuard** como *Proxy Product Owner*. Es una figura reconocida de Scrum para
exactamente este caso.

Lo que hay que dejar claro al equipo:

> "El Product Owner **sigue siendo el catedrático**. Él prioriza, él pide cambios y él acepta
> formalmente en la Review. Stuard solo verifica el día a día: comprueba que lo que hicimos cumple
> los criterios de aceptación **que ya están escritos** en el backlog. No inventa requisitos, no
> cambia prioridades. Si aparece una duda que los criterios no resuelven, se la preguntamos al
> catedrático."

**Por qué Stuard y no yo:** ser Scrum Master y Proxy PO a la vez es un anti-patrón. El Scrum
Master cuida el proceso, el Product Owner decide sobre el producto. Si fuera las dos cosas,
acabaría juzgando el resultado de mi propia facilitación. Stuard además ya lleva la Visión del
Producto, el Backlog y el Manual de Usuario.

**Cómo se registra:** Stuard es el **único** que mueve tarjetas a *Done* en el tablero. Ese
movimiento es la aceptación.

**Decisión:** ☐ Stuard ☐ otro: `______________`

### 2.7 Instalar el entorno
Que los cuatro instalen hoy mismo: **Node 22, Docker Desktop, Git y VS Code**.

> Aviso por experiencia propia: en Windows 11 Home, Docker Desktop falla con *"Virtualization
> support not detected"* si WSL no está instalado. Se arregla corriendo `wsl --install` en una
> terminal **como administrador** y reiniciando. Diles que lo hagan antes de su primer turno.

---

## Bloque 3 — Enseñar lo que ya existe (20 min)

**Esto es lo más delicado de la reunión.** Manéjalo con cuidado.

### Qué enseñar

Abre `http://localhost:5173` y ejecútalo delante de ellos:
1. La pantalla de login
2. Entras con `admin` / `EC321`
3. Aparece el listado de convocatorias, con color por tipo de beca
4. Cierras sesión y vuelve al login

Luego abre el repositorio en GitHub y enséñales **Insights → Network**: las cuatro ramas.

### Cómo decirlo — sé honesto

> "Me adelanté y armé un esqueleto del sistema para que no arrancáramos desde una carpeta vacía.
> **No es trabajo terminado ni es 'mío'**: es un punto de partida que hay que revisar, criticar y
> hacer nuestro. Está sin mergear, en ramas aparte, precisamente para que pase por revisión."

**No lo presentes como un logro personal.** Si el equipo siente que ya está todo hecho, se
desconecta — y eso es exactamente lo que te hunde en la defensa final, cuando el catedrático le
pregunte a cualquiera de los cuatro y no sepa responder.

### Lo que hay que dejar clarísimo

> "El enunciado nos evalúa por **justificar técnicamente nuestras elecciones**. En la presentación
> final el catedrático le puede preguntar a cualquiera de nosotros por qué elegimos el patrón
> State y no un enum con condicionales. Si el que responde no sabe, no nos salva que otro sí sepa.
>
> Por eso nadie firma código que no entienda."

### Menciona los defectos, no solo lo que funciona

Da credibilidad y abre la puerta a que critiquen:

- `/health` responde `ok` aunque la base de datos esté caída — está mal y hay que arreglarlo
- El dominio duplica los enums de Prisma: si cambia uno y no el otro, falla en ejecución
- El listado de convocatorias quedó detrás del login, pero **US-008 dice que debe verse sin
  cuenta**. Es una contradicción con nuestro propio backlog que hay que resolver en el Sprint 3

---

## Bloque 4 — Sprint Planning 1 (40 min)

### Sprint Goal 1

> **"Dejar el equipo constituido y con acceso, el repositorio funcionando con su flujo de
> trabajo, y el esqueleto técnico revisado, entendido y aprobado por el equipo."**

Escríbelo tal cual en la minuta.

### Sprint Backlog

Repasa cada tarea y **pregunta quién la toma**. No las asignes tú: el Anexo 3 compromete al
equipo a decidir por consenso. Los responsables de abajo son una propuesta, no una orden.

| # | Tarea | Pts | Propuesta |
|---|---|---|---|
| S1-01 | Acta de Constitución completa y firmada por los 4 | 3 | Isaac |
| S1-02 | Política de Trabajo firmada, con sanciones acordadas | 2 | Isaac |
| S1-03 | Invitar a los 3 al repositorio y que acepten | 1 | Isaac |
| S1-04 | Tablero en GitHub Projects con el backlog cargado | 2 | Isaac |
| S1-05 | **Estudiar el walking skeleton, criticarlo y abrir su PR** | 8 | Fernando |
| S1-06 | Revisar el PR del skeleton con comentarios reales | 2 | Stuard |
| S1-07 | Revisar y hacer propia la configuración de Git y CI | 3 | Ivan |
| S1-08 | Revisar el Documento de Arquitectura y firmarlo o corregirlo | 5 | Ivan |
| S1-09 | Revisar la Visión del Producto y las User Personas | 3 | Stuard |
| S1-10 | Revisar y priorizar el Product Backlog con el equipo | 5 | Stuard + Isaac |
| S1-11 | Definition of Done acordada y publicada | 1 | Todos |
| S1-12 | Corregir los 3 defectos detectados en el esqueleto | 5 | Fernando |

**Total: 40 puntos.**

Es mucho para un primer sprint, pero **la mayor parte es revisión y documentación, no código
nuevo**. Si al final quedan dos o tres sin terminar, no es un fracaso: es tu primer dato real de
velocidad, y con él planificas el Sprint 2.

### Lo que hay que explicar sobre S1-05 (la tarea de Fernando)

Su tarea **no es escribir el esqueleto** — ya existe. Su tarea es **entenderlo lo bastante como
para defenderlo**, criticarlo, corregir lo que no le convenza, y abrir el Pull Request como
autor responsable.

Dale el archivo `docs/12-preguntas-defensa-skeleton.md`: tiene el guion de preguntas por bloques.
El **Bloque 4** son las preguntas incómodas, sobre los defectos reales del código.

**Cuando lo presente el jueves 10, que el equipo se lo pregunte.** Si puede explicar por qué
`/health` está mal hecho, entendió la arquitectura de verdad.

### Orden de los Pull Requests — esto importa

Hay dos ramas y **el orden no es negociable**:

1. **Primero** se mergea `feature/S1-08-walking-skeleton` → `develop`
2. **Después** `feature/US-002-inicio-sesion` → `develop`

La rama del login está construida encima de la del skeleton. Si se mergea primero, arrastra los
commits del skeleton y el historial queda confuso.

---

## Bloque 5 — Cierre (15 min)

- [ ] Cada quien repite en voz alta qué tarea tomó y para cuándo
- [ ] Los tres confirmaron que aceptaron la invitación al repositorio
- [ ] Todos entraron al canal de comunicación elegido
- [ ] Recordar el formato del daily: **qué hice / qué haré / qué me bloquea**
- [ ] Próxima reunión: **jueves 10 de septiembre**, misma hora

**Tarea de Isaac esa misma noche:** llenar la minuta en `docs/minutas/sprint-01-planning.md`
usando la plantilla, y subirla al repositorio.

---

## Recordatorios para ti como Scrum Master

- **No eres el jefe.** Facilitas, no mandas. Si alguien propone algo mejor, se hace lo mejor.
- **Corta las discusiones largas.** Más de 5 minutos sin resolverse: se anota como pendiente y se
  sigue. *"Buen punto, lo dejo anotado y lo cerramos el viernes."*
- **Que hablen todos.** Si alguien lleva 20 minutos callado, pregúntale directamente qué opina.
  Hoy corres un riesgo especial: llegas con mucho hecho, y es fácil que los demás se callen.
- **Todo lo que se decide, se escribe.** La minuta es evidencia evaluable.

### Errores típicos de un Scrum Master primerizo

- Convertir la reunión en una presentación tuya. Hoy hablas mucho en el Bloque 3 — compénsalo
  preguntando en el Bloque 4.
- Asignar tareas tú solo. Se decide por consenso.
- Aceptar historias "casi terminadas". Si no cumple el DoD completo, no está hecha.
- Cargar el sprint con lo que *quisieran* hacer en vez de lo que cabe en 8 días-persona.
