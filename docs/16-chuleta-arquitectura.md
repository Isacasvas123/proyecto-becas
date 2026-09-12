# Chuleta — qué contestar cuando pregunten por la arquitectura

> Para los cuatro. **Apréndanse el bloque de 30 segundos.** Es lo mínimo que cualquiera del
> equipo debe poder decir sin leer. Lo demás es para cuando repregunten.

---

## La respuesta de una frase

> **"Monolito modular en capas, con puertos y adaptadores en las fronteras."**

---

## La respuesta de 30 segundos

> "Es un **monolito modular**: un solo programa que se despliega junto, pero dividido por dentro
> en módulos de negocio —convocatorias, usuarios, solicitudes, evaluaciones, reportes.
>
> Cada módulo tiene **cuatro capas**: dominio, aplicación, infraestructura y presentación.
>
> La regla importante es que **el dominio no depende de nada**. No sabe que existe NestJS, ni
> Prisma, ni la base de datos. Cuando necesita algo de afuera, declara una interfaz —un puerto—
> y la infraestructura la implementa."

---

## Las cuatro capas, con un ejemplo real

Si les piden explicarlo, usen el módulo `usuarios`, que ya está construido:

| Capa | Qué contiene | Ejemplo del código |
|---|---|---|
| **domain** | Las reglas del negocio. TypeScript puro | `Usuario`, `NombreUsuario`, y los puertos |
| **application** | Los casos de uso, que orquestan | `AutenticarUsuarioService` |
| **infrastructure** | Cómo se habla con el mundo exterior | `BcryptHasherAdapter`, `UsuarioPrismaRepositorio` |
| **presentation** | Cómo se expone por HTTP | `AuthController` |

**La regla de dependencia:**

```
presentation  →  application  →  domain
                                   ↑
                 infrastructure  ──┘
```

Todas las flechas apuntan al dominio. **El dominio no apunta a nadie.**

---

## Las cinco preguntas que les van a hacer

### 1. "¿Por qué no microservicios?"

> "Primero porque usted los descartó. Y además porque el dominio de becas es muy transaccional:
> una solicitud no existe sin su convocatoria, sus documentos y sus evaluaciones. Partirlo en
> servicios metería consistencia eventual en un expediente donde la integridad es un requisito
> legal. Y para cuatro personas en ocho semanas, la complejidad de despliegue no se paga."

### 2. "¿Y qué gana con separar en capas?"

> "Que cuando usted cambie las reglas de puntuación de las becas, el cambio ocurre en el dominio
> sin tocar la base de datos ni los controladores. Y que podemos probar la lógica de negocio sin
> levantar PostgreSQL: las 67 pruebas corren en segundos."

### 3. "¿Qué es un puerto y un adaptador?"

> "El puerto es una **interfaz que declara el dominio** con lo que necesita. El adaptador es la
> implementación concreta, que vive en infraestructura.
>
> Ejemplo real: el dominio necesita verificar contraseñas, así que declara `HasherPassword` con
> dos métodos. El adaptador `BcryptHasherAdapter` lo implementa con bcrypt. Si mañana hay que
> migrar a argon2, escribimos otro adaptador y cambiamos **una línea** en `usuarios.module.ts`.
> Ni la entidad ni el caso de uso se enteran."

### 4. "¿Cómo garantizan que se respete esa regla?"

> "No dependemos de que el revisor se acuerde. **ESLint lo verifica**: si alguien importa
> `@nestjs` o `@prisma/client` dentro de `domain/`, el linter falla y el CI bloquea el Pull
> Request. Lo comprobamos provocando la violación a propósito."

*Esta respuesta impresiona, porque la mayoría de equipos dejan la regla en el papel.*

### 5. "¿Dónde está eso documentado?"

> "En `docs/05-arquitectura.md`. Tiene la justificación, los trade-offs que asumimos, y un
> registro de nueve decisiones de arquitectura con su motivo y su fecha."

---

## Los trade-offs — dígalos ustedes primero

Si dicen que su arquitectura no tiene desventajas, no la entendieron. Las tres reales:

1. **Escala solo verticalmente.** Se compensa con la modularidad interna, que deja abierta la
   extracción futura de un módulo si hiciera falta.
2. **Un fallo puede afectar todo el sistema.** Se compensa con manejo centralizado de excepciones
   y pruebas de regresión antes de cada integración.
3. **Hay que escribir código de traducción** entre entidad de dominio, modelo de persistencia y
   DTO. **Lo aceptamos a propósito**: ese costo es exactamente lo que compra la independencia del
   dominio.

---

## Los patrones, en una tabla

Si preguntan por los seis:

| Tipo | Patrón | Qué problema resuelve | Estado |
|---|---|---|---|
| Creacional | Factory Method | Tres tipos de beca con reglas distintas | Sprint 3 |
| Creacional | Builder | Reportes con ocho filtros opcionales | Sprint 7 |
| Estructural | **Adapter** | Aislar bcrypt y JWT del dominio | ✅ **Hecho** |
| Estructural | Facade | Resolver una solicitud coordina 6 pasos | Sprint 6 |
| Comportamiento | State | Ciclo de vida de la solicitud | Sprint 4 |
| Comportamiento | Strategy | Distintos criterios de puntuación | Sprint 5 |

**Y si preguntan por qué solo uno está hecho:**

> "Porque implementar un patrón antes de tener el problema sería escribir código sin motivo, y el
> enunciado dice que el objetivo no es usar patrones por obligación sino resolver problemas de
> diseño. El Adapter lo adelantamos del Sprint 4 al 1 porque el inicio de sesión ya necesitaba
> aislar bcrypt. Cada uno entra en el sprint donde aparece la historia que lo origina."

---

## Repártanselo

Que cada quien pueda contestar **al menos** su parte:

| Quién | Se aprende |
|---|---|
| **Ivan** | Arquitectura: las 4 capas y las preguntas 1 a 5 |
| **Stuard** | Los seis patrones y su justificación |
| **Fernando** | Los diagramas y cómo se prueba el dominio sin base de datos |
| **Isaac** | El proceso: sprints, tablero, flujo de Git |

Pero **los cuatro** deben poder decir la respuesta de 30 segundos. En la defensa final el
catedrático puede preguntarle a cualquiera, y no salva que otro sí sepa.

---

*Fuente completa: `docs/05-arquitectura.md` (arquitectura), `docs/06-patrones.md` (patrones) y
`docs/15-matriz-trazabilidad.md` (cómo se conecta cada requisito con su código).*
