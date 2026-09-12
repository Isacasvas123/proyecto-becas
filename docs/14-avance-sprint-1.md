# Avance del Sprint 1 — presentación al Product Owner

> **Sábado 5 de septiembre de 2026.** Día 3 de 7 del Sprint 1 (jue 3 → mié 9).
> Esto **no es la Sprint Review** —esa es el jueves 10— sino un avance a mitad de sprint.
> Nadie espera que esté todo terminado, y decirlo así de entrada evita malentendidos.

---

## Cómo abrir la reunión

> "Estamos en el día 3 de 7 del primer sprint. Lo que le vamos a enseñar es un avance, no un
> entregable cerrado: hay cosas terminadas, cosas en revisión y cosas que sabemos que están mal
> y ya tenemos identificadas."

Empezar admitiendo el estado real da credibilidad para todo lo demás.

---

## 1. Software funcionando (10 min) — empiece por aquí

**No abra diapositivas. Abra el sistema.** El enunciado pide demostrar software funcionando.

Antes de la reunión: `docker compose up -d` y luego `npm run dev`.

### Guion de la demostración

| # | Qué hacer | Qué decir mientras tanto |
|---|---|---|
| 1 | Abrir `localhost:5173` | "Es la pantalla de acceso. El diseño lo tomamos de portales reales del Estado guatemalteco: SEGEPLAN y Becas por Nuestro Futuro." |
| 2 | Entrar con `admin` / `EC321` | "La contraseña se guarda con hash bcrypt. El sistema devuelve un token de sesión que caduca a las 8 horas." |
| 3 | Señalar la banda de cifras | "Estos números salen de la base de datos, no están escritos a mano." |
| 4 | Filtrar por *Posgrado* | "El filtro tiene contadores: el usuario sabe si vale la pena antes de hacer clic. Ese patrón lo tomamos de las bolsas de empleo locales." |
| 5 | Señalar "Cierra en 43 días" | "Es el dato que más le importa a un aspirante, por eso es lo único con color. Bajo 15 días se pone en ámbar." |
| 6 | Intentar entrar con contraseña incorrecta | "Fíjese que el mensaje es el mismo que si el usuario no existiera. Si fueran distintos, cualquiera podría averiguar qué usuarios existen." |

### Si pregunta por móvil

Achique la ventana del navegador. Todo se reacomoda: es el requisito no funcional de usar
desde 360 px, por la persona que definimos —Ana, aspirante de provincia con un teléfono.

---

## 2. Lo que hay construido (5 min)

| | |
|---|---|
| Documentos | **13** en Markdown, versionados en Git |
| Archivos de código | **64** TypeScript |
| Módulos del backend | `convocatorias` · `usuarios` · `salud` |
| Archivos de pruebas | **9** |
| Pruebas automatizadas | **72 unitarias + 32 de integración, todas en verde** |
| Commits | 14 |
| Tarjetas en el tablero | 43 |

**Anexos entregados:** 1 (Acta de Constitución, firmada por los 4) · 2 (minuta del Planning) ·
3 (Política de Trabajo, con sanciones consensuadas) · 4 (Visión, 4 User Personas, Product
Backlog con 31 historias, NFRs y Definition of Done) · 5 (Arquitectura con justificación,
trade-offs y 9 decisiones registradas).

**Además:** justificación de los 6 patrones de diseño, guía de Git para el equipo, guía de
instalación, y un guion de preguntas para verificar que cada quien entiende lo que defiende.

---

## 3. Decisiones que puede defender (5 min)

Si pregunta *"¿por qué eligieron esto?"*, tiene la respuesta escrita:

**Arquitectura: monolito modular en capas con puertos y adaptadores.**
El dominio no importa NestJS ni Prisma. Consecuencia práctica: cuando usted cambie las reglas de
puntuación, el cambio ocurre en el dominio sin tocar la base de datos ni los controladores. Y lo
verifica el linter, no solo el revisor: si alguien importa Prisma dentro de `domain/`, el CI
bloquea el Pull Request.

**Un patrón ya implementado antes de tiempo: Adapter.**
Estaba previsto para el Sprint 4, pero el inicio de sesión necesitaba aislar bcrypt y JWT. No lo
adelantamos por calendario: apareció porque apareció el problema.

**Un fallo de seguridad que encontramos con una prueba.**
Escribimos una prueba que decía "el hash no debe aparecer al serializar la entidad" y **falló**.
El `private` de TypeScript desaparece al compilar, así que el hash quedaba expuesto en
`JSON.stringify`. Se cambió a un campo privado real de JavaScript.

---

## 4. Lo que NO está terminado — dígalo usted primero (5 min)

Esta sección es la que da credibilidad. Si el catedrático lo descubre solo, es un hallazgo suyo;
si lo dice el equipo, es control del proyecto.

| Pendiente | Estado |
|---|---|
| **Ningún Pull Request mergeado** | Todo el trabajo está en ramas. `develop` solo tiene documentación. |
| **Protección de `main` sin activar** | Requiere GitHub Pro; el Student Pack se aprobó el 2 sep y aún no entran los beneficios. |
| **Sin despliegue en Staging** | Por eso ninguna historia cumple la Definition of Done completa. |
| **CI en rojo** | Tres fallos, todos de commits anteriores a que existiera el código. |

### Defectos: los tres del esqueleto, más los que encontró el equipo revisando

**Cerrados durante el sprint (S1-12):**

1. ✅ **`/health` respondía `ok` aunque PostgreSQL estuviera caído.** Separado en dos rutas:
   `/health` responde si el proceso vive, `/ready` devuelve 503 si la base no responde.
2. ✅ **El dominio duplicaba los enums de Prisma.** Mitigado con una prueba que los compara y
   falla en CI si divergen.

**Abierto y diferido con decisión escrita:**

3. 🔴 **US-008 incumplida en parte.** La historia dice que un *visitante* debe ver las
   convocatorias **sin cuenta**, y hoy quedaron detrás del login. El backend ya expone el
   listado sin sesión; falta separarlo en el frontend. **Se resuelve en el Sprint 3.**

**Encontrados por el equipo en los code reviews del 9 y 10 de septiembre**, todos corregidos:

| # | Quién lo encontró | Defecto | Estado |
|---|---|---|---|
| 4 | Stuard (PR #4) | El criterio 1 de US-003 lista **cuatro** roles y el enum del dominio declaraba tres: faltaba `PUBLICO` | ✅ Corregido |
| 5 | Fernando (PR #1) | La prueba de ordenamiento verificaba el **doble de prueba**, no el servicio: el repositorio en memoria ya ordenaba solo | ✅ Corregido |
| 6 | Fernando (PR #1) | La rama del `logger.warn` se recorría pero nunca se comprobaba | ✅ Corregido |
| 7 | Fernando (PR #4) | El esquema `bearer` en minúscula se rechazaba con 401, y el RFC 7235 §2.1 lo define *case-insensitive* | ✅ Corregido |
| 8 | Fernando (PR #4) | Con dos cabeceras `Authorization`, el rechazo ocurría por accidente y no por decisión | ✅ Corregido |
| 9 | Fernando (Anexo 5) | El diagrama de clases declaraba un método `estaVigente(Date)` que **nunca existió** en el código | ✅ Corregido |
| 10 | Fernando (Anexo 5) | El módulo `salud` y el puerto `VerificadorToken` faltaban en el diagrama de componentes y en `06-patrones.md` | ✅ Corregido |

> **Esto es lo que valió la pena del code review.** Siete de los diez defectos de este sprint no
> los encontró quien escribió el código, sino quien lo revisó. Ninguno era de estilo: dos eran
> criterios de aceptación incumplidos y tres eran pruebas que pasaban sin probar lo que decían.

---

## ⚠️ El riesgo que hay que atender hoy mismo

**Los 14 commits del repositorio son de una sola persona: Isaac.**

```
git shortlog -sn --all
    14  Isaac Castillo
```

El enunciado evalúa la **participación equitativa**, y el Anexo 3 la compromete por escrito. Si
el catedrático abre *Insights → Contributors*, va a ver una sola barra.

**No es falso que el equipo trabajó** —la reunión, las decisiones y la revisión de documentos son
reales— pero eso no aparece en Git.

**Cómo explicarlo si pregunta, sin excusas:**

> "Es real y lo tenemos identificado. El repositorio se montó en dos días para no arrancar de
> cero, y esos commits son míos. A partir de este sprint cada quien trabaja su rama: Fernando
> tiene asignada la revisión del esqueleto, Ivan la configuración y la arquitectura, y Stuard el
> backlog y los patrones. En la próxima Review las contribuciones se van a ver repartidas."

**Y que se vea de verdad esta semana.** Basta con que cada uno haga su trabajo en su propia rama
y abra su Pull Request. Tres commits de tres personas cambian por completo esa gráfica.

---

## 5. Cierre (2 min)

> "Para el miércoles cerramos el sprint con los Pull Requests revisados y mergeados. El jueves 10
> tenemos la Sprint Review formal con la Retrospectiva."

**Pregúntele dos cosas.** Es el Product Owner: usarlo como tal demuestra que entienden el rol.

1. ¿Hay algo en el Product Backlog que quiera repriorizar?
2. ¿El alcance del MVP sigue igual, o piensa introducir algún cambio en las próximas semanas?

Anote las respuestas en la minuta.
