# Documento de Diseño de Sistema Evolutivo
### Anexo 5 — Proyecto Final, Análisis de Sistemas II

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Equipo de Diseño** | Ivan (arquitectura) · Fernando (diagramas) · Stuard (patrones) · Isaac |
| **Fecha de Creación** | 3 de septiembre de 2026 |
| **Versión** | 1.0 — *documento vivo, se actualiza al cerrar cada sprint* |

---

## 2. Propuesta de Arquitectura del Sistema

### 2.1 Estilo Arquitectónico Seleccionado

**Monolito modular en capas (N-Layer) con inversión de dependencias en las fronteras
(puertos y adaptadores).**

Un único artefacto desplegable, organizado internamente en módulos de negocio autónomos. Cada
módulo se estructura en cuatro capas con una regla de dependencia estricta.

### 2.2 Justificación de la Elección

#### Alineación con los requisitos

**El Product Owner cambiará los requerimientos durante el semestre.** Esto no es una suposición:
el enunciado del proyecto lo declara explícitamente (memorandos, cambios regulatorios, nuevas
políticas, integraciones con otras instituciones). La decisión arquitectónica central se tomó
para responder a eso.

La regla de dependencia adoptada es:

```
presentation  ──▶  application  ──▶  domain
                                       ▲
                   infrastructure  ─────┘
```

El **dominio no importa nada** de las demás capas. Las dependencias externas —base de datos,
almacenamiento de archivos, envío de correo, servicios de terceros— se declaran como
**interfaces (puertos) dentro del dominio** y se implementan como **adaptadores en
infrastructure**.

La consecuencia práctica, que es lo que hay que defender: cuando el Ministerio cambie las reglas
de puntuación de las becas, el cambio ocurre en `domain/` y `application/`. No toca los
controladores, no toca la base de datos, y las pruebas unitarias del dominio siguen corriendo sin
levantar Postgres.

#### Por qué un monolito modular y no microservicios

Además de que **el catedrático descartó explícitamente los microservicios**, la decisión se
sostiene técnicamente:

| Criterio | Monolito modular | Microservicios |
|---|---|---|
| Complejidad de despliegue | Un artefacto, un pipeline | N servicios, orquestación, service discovery |
| Consistencia de datos | Transacciones ACID nativas | Consistencia eventual, sagas |
| Costo de infraestructura | Un servidor | N servicios + gateway + mensajería |
| Adecuado a 4 personas / 8 semanas | Sí | No |
| Latencia entre módulos | Llamada en memoria | Red |

El dominio de becas es **fuertemente transaccional y altamente acoplado por naturaleza**: una
solicitud no existe sin su convocatoria, sus documentos, sus evaluaciones y su resolución.
Fragmentarlo en servicios independientes introduciría consistencia eventual en un proceso donde
la integridad del expediente es un requisito legal, no una preferencia técnica.

#### Alineación con Scrum y la entrega incremental

La modularidad interna permite que los cuatro integrantes trabajen en módulos distintos durante
el mismo sprint sin colisionar en los mismos archivos, lo cual es crítico con el esquema de dos
días de trabajo por persona y turnos escalonados. Cada módulo se puede entregar y demostrar de
forma independiente en la Sprint Review.

#### Tecnologías clave

| Capa | Tecnología | Justificación |
|---|---|---|
| Backend | NestJS (Node 22, TypeScript) | Inyección de dependencias nativa: la inversión de dependencias del diseño se implementa con la herramienta, no contra ella |
| Frontend | React + Vite + TypeScript | Mismo lenguaje que el backend; los cuatro integrantes pueden revisar cualquier Pull Request |
| Persistencia | PostgreSQL + Prisma | Relacional (el dominio lo es); migraciones versionadas en Git, requisito del QAP |
| Pruebas | Jest + Supertest | Preconfigurado en NestJS; el dominio se prueba sin infraestructura |
| Entorno local | Docker Compose | Un comando levanta la base de datos idéntica para los cuatro |

**Justificación transversal del stack:** un solo lenguaje en todo el proyecto. Con dos días de
trabajo por persona a la semana no existe margen para que alguien quede bloqueado por
desconocer el lenguaje de la otra mitad del sistema, y el code review obligatorio entre pares
solo funciona si todos pueden leer todo el código.

#### Ventajas principales

- **Mantenibilidad:** cada módulo se comprende y modifica de forma aislada.
- **Bajo acoplamiento:** la lógica de negocio es independiente de la base de datos y de
  servicios externos.
- **Reutilización:** los servicios de aplicación se reutilizan entre controladores REST, tareas
  programadas y generación de reportes.
- **Facilidad de cambio:** las nuevas reglas de negocio entran como nuevas implementaciones de
  una interfaz existente, sin modificar el código que ya funciona (principio Open/Closed).
- **Testeabilidad:** el dominio se prueba con dobles de prueba, sin base de datos ni red.
- **Complejidad proporcional** al tamaño del equipo y al plazo disponible.

#### Compromisos y desventajas consideradas (trade-offs)

Ninguna arquitectura es gratis. Asumimos conscientemente:

1. **Escalabilidad únicamente vertical.** El sistema escala agregando recursos al servidor, no
   replicando servicios de forma selectiva. *Mitigación:* para el volumen esperado —del orden de
   decenas de miles de solicitudes por convocatoria— una instancia bien dimensionada es
   suficiente, y la modularidad interna deja abierta la extracción futura de un módulo a
   servicio independiente si el Ministerio lo requiriera.

2. **Un fallo puede afectar todo el sistema.** No hay aislamiento de fallos entre módulos.
   *Mitigación:* manejo centralizado de excepciones, pruebas de regresión antes de cada
   integración a `develop`, y despliegue previo a Staging.

3. **La arquitectura en capas añade código de traducción.** Mapear entre entidades de dominio,
   modelos de persistencia y DTOs de presentación es trabajo adicional que un CRUD directo no
   requeriría. *Lo aceptamos deliberadamente:* ese costo es exactamente lo que compra la
   independencia del dominio, que es el requisito central del proyecto.

4. **Riesgo de "monolito distribuido interno"** si los módulos se importan entre sí libremente.
   *Mitigación:* la comunicación entre módulos ocurre únicamente a través de la capa de
   aplicación, nunca importando entidades de dominio de otro módulo directamente. Es una regla
   que se verifica en cada code review.

5. **Curva de aprendizaje de NestJS.** *Mitigación:* en el Sprint 1 se construye un *walking
   skeleton* —un módulo completo de punta a punta— que sirve de plantilla para el resto.

---

### 2.3 Estructura del código

Estado real al **3 de septiembre de 2026** (✅ construido · ⬜ pendiente):

```
apps/api/src/
├─ modules/
│  ├─ usuarios/                                                    ✅ Sprint 1 (US-002)
│  │  ├─ domain/
│  │  │  ├─ entities/          Usuario
│  │  │  ├─ enums/             RolUsuario
│  │  │  ├─ value-objects/     NombreUsuario
│  │  │  └─ ports/             UsuarioRepositorio · HasherPassword · GeneradorToken
│  │  ├─ application/
│  │  │  ├─ services/          AutenticarUsuarioService
│  │  │  └─ dto/               SesionIniciadaDto
│  │  ├─ infrastructure/
│  │  │  ├─ persistence/       UsuarioPrismaRepositorio · UsuarioEnMemoriaRepositorio
│  │  │  └─ adapters/          BcryptHasherAdapter · JwtGeneradorTokenAdapter
│  │  └─ presentation/
│  │     ├─ controllers/       AuthController  (POST /auth/login)
│  │     └─ dto/               LoginRequestDto
│  ├─ convocatorias/                                               ✅ Sprint 1 (esqueleto)
│  │  └─ (misma estructura; solo la operación de lectura de US-008)
│  ├─ salud/                                                       ✅ GET /health
│  ├─ estudiantes/                                                 ⬜ Sprint 4
│  ├─ solicitudes/                                                 ⬜ Sprint 4
│  ├─ evaluaciones/                                                ⬜ Sprint 5
│  └─ reportes/                                                    ⬜ Sprint 7
├─ shared/
│  ├─ exceptions/              errores-dominio.ts · dominio-exception.filter.ts
│  ├─ persistence/             PrismaService · PrismaModule
│  └─ patterns/                ⬜ implementaciones transversales de patrones
└─ main.ts
```

**Notas sobre desviaciones respecto al diseño original:**

- **`domain/enums/`** no estaba previsto. Se añadió porque el dominio declara sus propios enums
  (`RolUsuario`, `TipoBeca`, `EstadoConvocatoria`) en vez de importar los de Prisma, que
  rompería la regla de capas. El precio es mantener dos listas sincronizadas; se mitiga con
  `usuario-prisma.mapper.spec.ts`, que compara ambos conjuntos y falla en CI si divergen.
- **`shared/persistence/`** aloja el `PrismaService` compartido por los seis módulos, en vez de
  duplicar la conexión en cada uno.
- **`modules/salud/` no tiene las cuatro capas** a propósito: no contiene reglas de negocio.
  Aplicarle la estructura completa sería ceremonia vacía. La arquitectura se aplica donde
  aporta, no por reglamento.

**Responsabilidad de cada capa**

| Capa | Contiene | Nunca contiene |
|---|---|---|
| `domain/` | Entidades, objetos de valor, reglas de negocio, interfaces de puertos | Imports de NestJS, Prisma, HTTP o cualquier framework |
| `application/` | Casos de uso, orquestación, transacciones | SQL, detalles de HTTP |
| `infrastructure/` | Repositorios Prisma, adaptadores de almacenamiento y correo | Reglas de negocio |
| `presentation/` | Controladores REST, DTOs, validación de entrada | Lógica de negocio |

**Cómo se verifica en el code review:** si un archivo dentro de `domain/` tiene un `import` de
`@nestjs/common` o de `@prisma/client`, el Pull Request se rechaza.

---

### 2.4 Aplicación de los principios SOLID

| Principio | Cómo se aplica en este proyecto |
|---|---|
| **S** — Responsabilidad única | Cada servicio de aplicación implementa un solo caso de uso. `EnviarSolicitudService` no evalúa ni notifica: delega. |
| **O** — Abierto/cerrado | Un nuevo tipo de beca se agrega registrando una nueva `CriterioEvaluacionStrategy` y un nuevo producto en `ConvocatoriaFactory`, sin modificar el código existente. |
| **L** — Sustitución de Liskov | Toda implementación de `CriterioEvaluacionStrategy` respeta el mismo contrato: recibe una solicitud y devuelve un puntaje entre 0 y 100, sin excepciones inesperadas. |
| **I** — Segregación de interfaces | Puertos pequeños y específicos: `AlmacenamientoDocumentosPort` expone `guardar`, `obtener` y `eliminar`, no una interfaz genérica de "servicios externos". |
| **D** — Inversión de dependencias | Los servicios de aplicación dependen de interfaces declaradas en el dominio; las implementaciones concretas se inyectan mediante el contenedor de NestJS. |

---

## 3. Diagramas Esenciales

Los tres diagramas están **elaborados** y viven en `docs/diagramas/`, escritos en **Mermaid
dentro de Markdown**. No son imágenes: son texto versionado, así que cada cambio se revisa línea
por línea en el Pull Request en lugar de un archivo binario opaco.

| Diagrama | Archivo | Contenido |
|---|---|---|
| **3.1 Casos de uso** | [`diagramas/01-casos-de-uso.md`](diagramas/01-casos-de-uso.md) | 5 actores, 17 casos de uso agrupados, relaciones `include` y `extend`, y **el detalle de los casos que cubren los nueve objetivos del enunciado**: precondiciones, flujo principal, flujos alternos, flujos de excepción y postcondiciones |
| **3.2 Componentes** | [`diagramas/02-componentes.md`](diagramas/02-componentes.md) | Vista general del despliegue, los seis módulos con sus dependencias, **la tabla de puertos y sus adaptadores**, y los tres entornos |
| **3.3 Clases** | [`diagramas/03-clases-dominio.md`](diagramas/03-clases-dominio.md) | Modelo de dominio con 9 entidades, las jerarquías de los patrones State y Strategy, el diagrama de transiciones de estado y los objetos de valor |

**Lo que hay que mirar en cada uno:**

- En **componentes**, la flecha punteada de `infrastructure` hacia `domain`. En una arquitectura
  tradicional iría al revés; aquí está invertida, y eso es toda la decisión de diseño.
- En **clases**, que la jerarquía de `EstadoSolicitud` rechaza todo por defecto y cada estado
  concreto solo sobrescribe lo que sí permite. Una transición ilegal es imposible, no
  desaconsejada.
- En **casos de uso**, que el Visitante es un actor de pleno derecho. El enunciado exige
  transparencia, y sin ese actor la consulta pública sin cuenta desaparecería del diseño.

---

## 4. Registro de Decisiones de Arquitectura

Toda decisión relevante se registra aquí con su fecha y su motivo. Este registro es lo que
permite responder "¿por qué hicieron esto así?" en la presentación final.

| # | Fecha | Decisión | Motivo | Estado |
|---|---|---|---|---|
| ADR-01 | 03/09/2026 | Monolito modular en capas | Restricción del PO + dominio transaccional + equipo de 4 en 8 semanas | Aceptada |
| ADR-02 | 03/09/2026 | TypeScript en todo el stack | Un solo lenguaje habilita el code review cruzado obligatorio | Aceptada |
| ADR-03 | 03/09/2026 | PostgreSQL relacional | El dominio de becas es inherentemente relacional y transaccional | Aceptada |
| ADR-04 | 03/09/2026 | Puertos y adaptadores en las fronteras | El PO cambiará requerimientos e integraciones durante el semestre | Aceptada |
| ADR-05 | 03/09/2026 | `bcryptjs` en vez de `bcrypt` | `bcrypt` es un módulo nativo que se compila al instalar; en un equipo de 4 máquinas distintas una compilación fallida bloquea a alguien un día entero. `bcryptjs` implementa el mismo algoritmo en JS puro y cumple igual el NFR de seguridad. Es más lento, cosa irrelevante porque bcrypt es lento a propósito | Aceptada |
| ADR-06 | 03/09/2026 | Campos privados de JavaScript (`#`) para datos sensibles del dominio | El `private` de TypeScript desaparece al compilar: el hash de contraseña quedaba visible en `Object.keys()` y `JSON.stringify()`. Detectado por una prueba que falló. Un `#` es privado en tiempo de ejecución | Aceptada |
| ADR-07 | 03/09/2026 | La sesión del frontend vive solo en memoria, no en `localStorage` | Un token en `localStorage` es legible por cualquier script: un XSS bastaría para robarlo. Se acepta el costo de reautenticar al recargar. La solución definitiva es una cookie `httpOnly`, prevista en el Sprint 2 con US-003 | Aceptada, revisar en Sprint 2 |
| ADR-08 | 03/09/2026 | La regla de capas se verifica con ESLint, no solo en code review | `no-restricted-imports` rechaza importar `@nestjs/*`, `@prisma/client` o HTTP dentro de `domain/`. Antes dependía de que el revisor se acordara; ahora lo bloquea el CI | Aceptada |
| ADR-09 | 17/10/2026 | Bitacora de auditoria escrita por un MIDDLEWARE, no por cada caso de uso | Exigencia del PO. Auditar es transversal: repetir la escritura en cada servicio la mezclaria con las reglas de negocio y bastaria olvidarla en un endpoint nuevo para perder el registro, sin que nadie lo note. Se penso primero como interceptor, pero una prueba de integracion mostro que en NestJS los guards corren antes: los 403 del control de acceso nunca se registraban, y son los que mas interesa auditar. El middleware se engancha al evento finish de la respuesta, cuando el codigo ya es definitivo y el guard ya dejo el portador | Aceptada |
| ADR-10 | | | | |

---

## 5. Análisis de Impacto de Cambios de Requerimientos

Cada vez que el Product Owner emita un cambio, se registra aquí antes de implementarlo.

| # | Fecha | Cambio solicitado | Componentes afectados | Esfuerzo | Decisión de diseño |
|---|---|---|---|---|---|
| CR-01 | | | | | |

> **Instrucción para el equipo:** este registro es evaluable. El enunciado califica
> explícitamente la *capacidad de adaptarse al cambio*, y sin evidencia escrita no hay nada que
> calificar. Aunque el cambio sea pequeño, se documenta.
