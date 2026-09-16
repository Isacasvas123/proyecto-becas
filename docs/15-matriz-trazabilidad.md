# Matriz de Trazabilidad — del requisito al código

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Responsable** | Isaac (Scrum Master) · revisada por todo el equipo |
| **Fecha** | 5 de septiembre de 2026 · **Versión** 1.0 |

---

## Para qué sirve este documento

El enunciado plantea nueve objetivos específicos. El Product Backlog los desarrolla en 31
historias. La arquitectura define seis módulos. Los patrones resuelven seis problemas de diseño.
Y el código son 64 archivos.

**Cuatro documentos separados no demuestran que el sistema esté bien diseñado; demuestran que se
escribieron cuatro documentos.** Lo que lo demuestra es poder recorrer, para cualquier requisito,
la cadena completa:

```
requisito del enunciado → historia de usuario → módulo → patrón → archivo → prueba
```

Esta matriz es esa cadena. Sirve para tres cosas concretas:

1. **Verificar que no falta nada.** Si un objetivo del enunciado no aparece aquí, no está cubierto.
2. **Justificar cada patrón.** Un patrón que no se puede rastrear hasta un requisito real es
   decoración, y el enunciado dice textualmente que el objetivo no es usar patrones por
   obligación sino resolver problemas de diseño.
3. **Responder en la defensa.** Cuando pregunten *"¿dónde está esto y por qué así?"*, la
   respuesta es una fila de esta tabla.

---

## 1. Cobertura de los objetivos del enunciado

Los nueve objetivos específicos del proyecto, y dónde se resuelve cada uno.

| # | Objetivo del enunciado | Epic | Historias | Módulo | Sprint | Estado |
|---|---|---|---|---|---|---|
| 1 | Administrar convocatorias | EPIC-02 | US-006 a US-010 | `convocatorias` | 3 | 🟡 Crear, publicar y listado público · faltan cerrar y editar |
| 2 | Registrar estudiantes | EPIC-01, EPIC-03 | US-001, US-011 | `usuarios`, `estudiantes` | 2, 4 | 🟡 Registro hecho (US-001) · falta el perfil académico (US-011) |
| 3 | Gestionar solicitudes | EPIC-03 | US-012, US-014 a US-016 | `solicitudes` | 4 | 🔴 Pendiente |
| 4 | Cargar documentación | EPIC-03 | US-013 | `solicitudes` | 4 | 🔴 Pendiente |
| 5 | Administrar evaluaciones | EPIC-04 | US-019, US-021 | `evaluaciones` | 5 | 🔴 Pendiente |
| 6 | Gestionar comités evaluadores | EPIC-04 | US-017, US-018, US-020 | `evaluaciones` | 5 | 🔴 Pendiente |
| 7 | Aprobar o rechazar solicitudes | EPIC-05 | US-023, US-024, US-026 | `solicitudes` | 6 | 🔴 Pendiente |
| 8 | Consultar el estado de una beca | EPIC-05 | US-025, US-027 | `solicitudes` | 6 | 🔴 Pendiente |
| 9 | Generar reportes básicos | EPIC-06 | US-028 a US-031 | `reportes` | 7 | 🔴 Pendiente |

**Requisitos transversales**, que no son objetivos funcionales pero el enunciado evalúa:

| Requisito | Dónde se resuelve | Estado |
|---|---|---|
| Control de acceso por rol | `usuarios` · US-002, US-003 | 🟢 Guard global *seguro por defecto*, 4 roles, 403 verificado con pruebas e2e |
| Trazabilidad del proceso | `solicitudes` · US-016, historial de estados | 🔴 Sprint 4 |
| Transparencia | Consulta pública sin autenticación · US-025 | 🔴 Sprint 6 |

🟢 Terminado · 🟡 Parcial · 🔴 Pendiente

---

## 2. Trazabilidad de los patrones de diseño

**Regla que nos impusimos:** ningún patrón entra al proyecto sin una fila completa en esta tabla.
Si no se puede nombrar el problema concreto y la historia que lo origina, el patrón no se usa.

### Creacionales

| | **Factory Method** |
|---|---|
| **Problema real** | Tres programas de beca —medio, universitaria, posgrado— se crean con requisitos, documentos exigidos y límites de cupo distintos |
| **Origen** | US-006, criterio de aceptación: *"Cada tipo trae por defecto sus requisitos y documentos exigidos"* |
| **Alternativa descartada** | Constructor con `switch` sobre el tipo: violaría Open/Closed cada vez que el PO agregue un programa |
| **Ubicación** | `modules/convocatorias/domain/factories/convocatoria.factory.ts` |
| **Prueba que lo verifica** | Que cada fábrica concreta produzca los requisitos correctos y rechace cupos fuera de rango |
| **Sprint** | 3 · Responsable: Stuard |
| **Estado** | 🔴 Pendiente |

| | **Builder** |
|---|---|
| **Problema real** | Los reportes combinan ocho filtros opcionales e independientes; un constructor único produce el anti-patrón telescópico |
| **Origen** | US-028, y US-030 para el formato de salida |
| **Alternativa descartada** | Objeto de configuración plano: no valida combinaciones incoherentes ni impide construir un reporte a medias |
| **Ubicación** | `modules/reportes/application/builders/reporte.builder.ts` |
| **Prueba que lo verifica** | Que `build()` rechace combinaciones inválidas de filtros |
| **Sprint** | 7 · Responsable: Stuard |
| **Estado** | 🔴 Pendiente |

### Estructurales

| | **Adapter** ✅ |
|---|---|
| **Problema real** | El dominio necesita verificar contraseñas y emitir sesiones sin depender de `bcryptjs` ni de `@nestjs/jwt`; y el enunciado anticipa integraciones con otras instituciones |
| **Origen** | US-002 · NFR de seguridad: *"las contraseñas deben almacenarse con hash"* |
| **Alternativa descartada** | Llamar a bcrypt dentro de la entidad: acopla el dominio y vuelve lentas las pruebas unitarias |
| **Ubicación** | `usuarios/domain/ports/hasher-password.ts` → `BcryptHasherAdapter`<br>`usuarios/domain/ports/generador-token.ts` → `JwtGeneradorTokenAdapter`<br>`usuarios/domain/ports/usuario.repositorio.ts` → `UsuarioPrismaRepositorio` y `UsuarioEnMemoriaRepositorio` |
| **Prueba que lo verifica** | `autenticar-usuario.service.spec.ts` — 8 pruebas que corren con dobles, sin bcrypt real ni base de datos |
| **Sprint** | **1** (adelantado del 4: apareció el problema, no la fecha) |
| **Estado** | 🟢 **Implementado y probado** |

| | **Facade** |
|---|---|
| **Problema real** | Resolver una solicitud coordina seis colaboradores: dictámenes, cupos, transición de estado, auditoría, acta y notificación |
| **Origen** | US-023 |
| **Alternativa descartada** | Que el controlador orqueste los seis: filtra lógica de negocio a presentación y la duplica en cada punto de entrada |
| **Ubicación** | `modules/solicitudes/application/facades/solicitud.facade.ts` |
| **Prueba que lo verifica** | Que una aprobación sin cupos disponibles falle sin dejar el expediente a medias |
| **Sprint** | 6 · Responsable: Ivan |
| **Estado** | 🔴 Pendiente |

### De comportamiento

| | **State** |
|---|---|
| **Problema real** | La solicitud recorre `BORRADOR → ENVIADA → EN_EVALUACION → APROBADA \| RECHAZADA → ADJUDICADA`, y cada estado permite operaciones distintas. Las transiciones ilegales deben ser **imposibles**, no solo desaconsejadas |
| **Origen** | US-012, US-014, US-023 |
| **Alternativa descartada** | Un `enum` con condicionales: la lógica queda dispersa y basta olvidar un `if` para corromper un expediente |
| **Ubicación** | `modules/solicitudes/domain/estados/` |
| **Prueba que lo verifica** | Que evaluar un borrador o adjudicar una solicitud rechazada lance excepción |
| **Sprint** | 4 · Responsable: Stuard |
| **Estado** | 🔴 Pendiente |

| | **Strategy** |
|---|---|
| **Problema real** | Cada tipo de beca se puntúa distinto: mérito académico, necesidad socioeconómica o mixto. El enunciado advierte de cambios normativos durante el semestre |
| **Origen** | US-019 |
| **Alternativa descartada** | Fórmula configurable en base de datos: no es testeable unitariamente, y un cálculo que asigna fondos públicos debe estar versionado y auditado por code review |
| **Ubicación** | `modules/evaluaciones/domain/strategies/` |
| **Prueba que lo verifica** | Cada fórmula con sus casos límite, y que `CriterioMixto` componga las otras dos en vez de duplicarlas |
| **Sprint** | 5 · Responsable: Stuard |
| **Estado** | 🔴 Pendiente |

### Resumen del cumplimiento

| Categoría | Exigido | Definidos | Implementados |
|---|---|---|---|
| Creacionales | 2 | 2 | 0 |
| Estructurales | 2 | 2 | **1** |
| De comportamiento | 2 | 2 | 0 |

> **Cómo presentar esto sin adornarlo:** los seis están definidos con su problema, su alternativa
> descartada y su ubicación prevista; **uno está implementado y probado**. Los cinco restantes
> entran en el sprint donde aparece la historia que los origina. Implementarlos antes sería
> escribir código sin problema que resolver, que es justo lo que el enunciado descarta.

---

## 3. Trazabilidad de los principios SOLID

| Principio | Dónde se puede verificar hoy |
|---|---|
| **S** — Responsabilidad única | `AutenticarUsuarioService` solo autentica: no registra, no notifica, no cambia perfiles |
| **O** — Abierto/cerrado | Un tipo de beca nuevo se agrega registrando una estrategia y una fábrica, sin modificar código existente *(verificable a partir del Sprint 3)* |
| **L** — Sustitución de Liskov | `UsuarioPrismaRepositorio` y `UsuarioEnMemoriaRepositorio` son intercambiables sin que el caso de uso cambie una línea. Lo demuestra la prueba unitaria |
| **I** — Segregación de interfaces | `HasherPassword` declara dos métodos, no una interfaz genérica de "servicios externos" |
| **D** — Inversión de dependencias | Los tres puertos de `usuarios` se enlazan en `usuarios.module.ts` con `provide`/`useClass` |

**Verificación automática:** la regla de capas no depende de que el revisor se acuerde. ESLint
rechaza cualquier import de `@nestjs/*`, `@prisma/client` o HTTP dentro de `domain/`, y el CI
bloquea el Pull Request. Comprobado provocando la violación a propósito.

---

## 4. Lo que falta y quién lo tiene asignado

Ser explícito con los huecos es parte de tener el diseño bajo control.

| Hueco | Anexo | Responsable | Sprint |
|---|---|---|---|
| **Diagrama de casos de uso + detalle de cada caso** | 5 §3.1 | Fernando | 2 |
| **Diagrama de componentes** | 5 §3.2 | Fernando | 2 |
| **Diagrama de clases / modelo de dominio** | 5 §3.3 | Fernando | 2 |
| Plan de Aseguramiento de Calidad | 6 | Fernando | 7 |
| Plan de Pruebas | 7 | Fernando | 7 |
| Manual Técnico | — | Isaac | 8 |
| Manual de Usuario | — | Stuard | 8 |

> Los tres diagramas son el hueco más visible del Anexo 5 y por eso encabezan el Sprint 2.
> Se elaborarán en **Mermaid dentro de archivos Markdown**, para que queden versionados como
> texto y sus cambios se vean en los Pull Requests, no como imágenes opacas.

---

## 5. Cómo se mantiene esta matriz

- Se revisa **en cada Sprint Planning**, al decidir qué historias entran.
- Ningún patrón nuevo se implementa sin su fila completa: problema, origen, alternativa
  descartada, ubicación y prueba.
- El estado se actualiza al cerrar cada sprint, junto con la minuta.
- Si el Product Owner introduce un requisito nuevo, se agrega a la sección 1 **antes** de
  escribir código, y su análisis de impacto va al registro de `docs/05-arquitectura.md §5`.
