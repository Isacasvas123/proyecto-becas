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

```
apps/api/src/
├─ modules/
│  ├─ usuarios/
│  │  ├─ domain/
│  │  │  ├─ entities/          Usuario, Rol
│  │  │  ├─ value-objects/     Cui, CorreoElectronico, Password
│  │  │  └─ ports/             UsuarioRepositorio (interfaz)
│  │  ├─ application/
│  │  │  ├─ services/          RegistrarUsuarioService, AutenticarService
│  │  │  └─ dto/
│  │  ├─ infrastructure/
│  │  │  ├─ persistence/       UsuarioRepositorioPrisma (implementa el puerto)
│  │  │  └─ adapters/
│  │  └─ presentation/
│  │     ├─ controllers/       UsuariosController
│  │     └─ dto/               Request/Response con validación
│  ├─ convocatorias/           (misma estructura)
│  ├─ estudiantes/
│  ├─ solicitudes/
│  ├─ evaluaciones/
│  └─ reportes/
├─ shared/
│  ├─ exceptions/              Excepciones de dominio y filtro global
│  ├─ patterns/                Implementaciones transversales de patrones
│  └─ config/
└─ main.ts
```

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

> Se elaboran en el Sprint 2 (responsable: Fernando) y se versionan en `docs/diagramas/`.
> Herramienta recomendada: **Mermaid** dentro de archivos Markdown, para que los diagramas
> queden bajo control de versiones como texto y sus cambios sean visibles en los Pull Requests.

### 3.1 Diagrama de Casos de Uso

*(Pendiente — Sprint 2)*

**Actores identificados:** Estudiante Aspirante · Evaluador · Administrador del Ministerio ·
Visitante (público, sin autenticación) · Sistema de Notificaciones (actor secundario).

Cada caso de uso llevará su **detalle** documentado: actor principal, precondiciones, flujo
principal paso a paso, flujos alternos, flujos de excepción y postcondiciones. El enunciado del
proyecto lo exige explícitamente.

### 3.2 Diagrama de Componentes

*(Pendiente — Sprint 2)*

Debe reflejar: `WebApp (React)` → `API REST (NestJS)` → los seis módulos de negocio → los puertos
de infraestructura → `PostgreSQL`, `Almacenamiento de Documentos` y `Servicio de Notificaciones`.
Deben mostrarse las **interfaces** y las relaciones de dependencia, no solo las cajas.

### 3.3 Diagrama de Clases (Modelo de Dominio Inicial)

*(Pendiente — Sprint 2)*

**Entidades principales y sus relaciones:**

- `Usuario` (1) ──── (0..1) `Estudiante`
- `Convocatoria` (1) ──── (0..*) `Solicitud`
- `Estudiante` (1) ──── (0..*) `Solicitud`
- `Solicitud` (1) ──── (0..*) `Documento`
- `Solicitud` (1) ──── (0..*) `Evaluacion`
- `Solicitud` (1) ──── (0..*) `HistorialEstado`
- `Comite` (1) ──── (1..*) `Evaluador` · `Comite` (1) ──── (1) `Convocatoria`
- `Solicitud` (1) ──── (0..1) `Beca` *(al adjudicarse)*
- `Solicitud` ──── `EstadoSolicitud` *(jerarquía del patrón State)*
- `Evaluacion` ──── `CriterioEvaluacionStrategy` *(jerarquía del patrón Strategy)*

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
| ADR-05 | | | | |

---

## 5. Análisis de Impacto de Cambios de Requerimientos

Cada vez que el Product Owner emita un cambio, se registra aquí antes de implementarlo.

| # | Fecha | Cambio solicitado | Componentes afectados | Esfuerzo | Decisión de diseño |
|---|---|---|---|---|---|
| CR-01 | | | | | |

> **Instrucción para el equipo:** este registro es evaluable. El enunciado califica
> explícitamente la *capacidad de adaptarse al cambio*, y sin evidencia escrita no hay nada que
> calificar. Aunque el cambio sea pequeño, se documenta.
