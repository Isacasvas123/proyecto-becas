# Guion de verificación — Walking Skeleton (S1-08)

Para Isaac (Scrum Master). Úsalo en la reunión del jueves 10 de septiembre, o antes, cuando
Fernando presente el walking skeleton al equipo.

**Propósito:** confirmar que quien presenta la estructura del proyecto la entiende de verdad y
puede defenderla ante el catedrático. No es un examen — es un ensayo de la presentación final.

**Cómo usarlo:** que Fernando explique el módulo `convocatorias` en 10 minutos, y luego los
otros tres le hacen estas preguntas. Si tropieza en alguna, no pasa nada — se anota y se estudia.
Lo grave sería descubrirlo el 31 de octubre.

---

## Bloque 1 — Las capas

**1.1** Abre `apps/api/src/modules/convocatorias/`. ¿Qué hay en cada una de las cuatro carpetas y
por qué esa separación?

> *Debe distinguir: `domain` = reglas de negocio puras · `application` = casos de uso que
> orquestan · `infrastructure` = cómo se habla con la base de datos y el mundo exterior ·
> `presentation` = cómo se expone por HTTP.*

**1.2** ¿Por qué `domain/` no puede importar NestJS ni Prisma? ¿Qué se ganaría y qué se perdería
si lo permitiéramos?

> *Se gana: menos código de traducción, más rápido de escribir. Se pierde: el dominio deja de ser
> probable sin base de datos, y cambiar de ORM obligaría a reescribir las reglas de negocio.*

**1.3** Si mañana el Ministerio nos obliga a cambiar de PostgreSQL a SQL Server, ¿qué carpetas
habría que tocar y cuáles no?

> *Solo `infrastructure/`. El dominio y la aplicación no se enteran. Esta es la respuesta que
> justifica toda la arquitectura.*

## Bloque 2 — Inversión de dependencias

**2.1** Busca el archivo del puerto en `domain/ports/`. ¿Por qué el servicio de aplicación depende
de esa interfaz y no directamente del repositorio de Prisma?

**2.2** ¿Qué es el token de inyección (el `Symbol`) y por qué hace falta? ¿No bastaría con
importar la clase?

> *En TypeScript las interfaces desaparecen al compilar, así que NestJS no puede inyectar "una
> interfaz". El token es el identificador que sí existe en tiempo de ejecución.*

**2.3** ¿Cuál de los principios SOLID es este exactamente, y en qué se diferencia del principio de
segregación de interfaces?

## Bloque 3 — Las pruebas

**3.1** Abre el spec del servicio de aplicación. ¿Por qué se puede probar sin levantar PostgreSQL?

**3.2** ¿Qué es el repositorio en memoria y qué papel juega?

**3.3** Hay una prueba que usa un repositorio "defectuoso" a propósito. ¿Qué está verificando y
por qué el servicio vuelve a filtrar lo que el repositorio ya filtró?

> *Es una defensa deliberada. Pregunta abierta para el equipo: ¿vale la pena esa pasada
> redundante, o es desconfianza innecesaria hacia nuestro propio código?*

**3.4** ¿Por qué `ConvocatoriaPrismaRepositorio` está a 0% de cobertura y qué prueba falta?

## Bloque 4 — Los puntos débiles (los más importantes)

Estas son las preguntas incómodas. El catedrático va a hacer alguna parecida.

**4.1** El endpoint `/health` responde `ok` aunque la base de datos esté caída. ¿Por qué se hizo
así y por qué está mal? ¿Cómo lo arreglarías?

**4.2** El dominio declara sus propios enums en vez de usar los de Prisma. ¿Qué pasa si alguien
cambia un valor solo en el `schema.prisma`? ¿Cómo lo detectaríamos antes de que explote?

**4.3** Hay dos DTOs prácticamente idénticos, uno en `application/dto` y otro en
`presentation/dto`. ¿Es duplicación innecesaria o hay una razón? Defiende tu postura.

**4.4** El módulo `salud` no tiene las cuatro capas. ¿Es una incoherencia de nuestra arquitectura?

> *No: no tiene reglas de negocio. Aplicar las cuatro capas ahí sería ceremonia vacía. Buena
> ocasión para explicar que la arquitectura se aplica donde aporta, no por reglamento.*

## Bloque 5 — Herramientas y proceso

**5.1** ESLint rechaza un import de Prisma dentro de `domain/`. ¿Dónde está configurada esa regla
y por qué la automatizamos en vez de confiar en el code review?

**5.2** ¿Qué hace `npm run db:migrate` y por qué las migraciones se versionan en Git?

**5.3** El CI corre en cada Pull Request. ¿Qué pasa si las pruebas fallan? ¿Se puede mergear
igual?

---

## Después de la sesión

- [ ] Anotar las preguntas que quedaron sin respuesta
- [ ] Asignar quién estudia cada tema y para cuándo
- [ ] Corregir en el Sprint 2 los tres puntos débiles detectados (`/health`, enums, carpetas no
      documentadas en el Anexo 5)
- [ ] Repetir el ejercicio con los otros documentos: Ivan defiende la arquitectura, Stuard los
      patrones, Fernando los diagramas

> **Regla del equipo:** ninguno de los cuatro debe llegar a la presentación final sin poder
> explicar cualquier parte del proyecto. Si en la defensa el catedrático le pregunta a uno y ese
> no sabe, no lo salva que otro sí sepa.
