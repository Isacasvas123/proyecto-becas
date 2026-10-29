# Matriz de Trazabilidad — del requisito al código

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Responsable** | Isaac (Scrum Master) · revisada por todo el equipo |
| **Fecha** | 5 de septiembre de 2026 · **Versión** 2.0 (28 oct: requerimientos del Product Owner, Observer y estado final) |

---

## Para qué sirve este documento

El enunciado plantea nueve objetivos específicos. El Product Backlog los desarrolla en 36
historias. La arquitectura define nueve módulos, los patrones resuelven siete problemas de diseño
y la API son 206 archivos de TypeScript, contando sus pruebas unitarias.

Esta matriz une esos documentos: para cualquier requisito se puede recorrer la cadena completa.

```
requisito del enunciado → historia de usuario → módulo → patrón → archivo → prueba
```

Sirve para tres cosas concretas:

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
| 2 | Registrar estudiantes | EPIC-01, EPIC-03 | US-001, US-011 | `usuarios`, `estudiantes` | 2, 4 | 🟢 Registro (US-001) y perfil académico (US-011) · verificado en Staging |
| 3 | Gestionar solicitudes | EPIC-03 | US-012, US-014 a US-016 | `solicitudes` | 4 | 🟢 Crear, enviar, listar e historial · verificado en Staging |
| 4 | Cargar documentación | EPIC-03 | US-013 | `solicitudes` | 4 | 🟢 PDF/JPG/PNG hasta 5 MB, validados por contenido · verificado en Staging |
| 5 | Administrar evaluaciones | EPIC-04 | US-019, US-021, US-036 | `evaluaciones` | 5, 8 | 🟢 Dictamen con puntaje calculado y consolidado, y visor de documentos en la pantalla del dictamen · fórmulas por confirmar con el PO · verificado en Staging |
| 6 | Gestionar comités evaluadores | EPIC-04 | US-017, US-018, US-020 | `evaluaciones` | 5 | 🟢 Comités, cuentas de evaluador, asignación y retiro de integrantes · verificado en Staging |
| 7 | Aprobar o rechazar solicitudes | EPIC-05 | US-023, US-024, US-026 | `resoluciones` | 6 | 🟡 Aprobar, rechazar y adjudicar, con segunda firma sobre Q10,000 · falta el acta (US-026) |
| 8 | Consultar el estado de una beca | EPIC-05 | US-025, US-027 | `resoluciones` | 6 | 🟡 Consulta pública verificada en Staging · falta la publicación de resultados (US-027) |
| 9 | Generar reportes básicos | EPIC-06 | US-028 a US-031 | `reportes` | 7 | 🟢 Reporte con filtros, panel, CSV/PDF y regiones · verificado en Staging |

**Requisitos transversales**, que no son objetivos funcionales pero el enunciado evalúa:

| Requisito | Dónde se resuelve | Estado |
|---|---|---|
| Control de acceso por rol | `usuarios` · US-002, US-003 | 🟢 Guard global *seguro por defecto*, 4 roles, 403 verificado con pruebas e2e |
| Trazabilidad del proceso | `solicitudes` · US-016, historial de estados | 🟢 Cada transición queda con fecha, autor y motivo; la tabla solo recibe inserciones |
| Transparencia | Consulta pública sin autenticación · US-025 | 🟢 Número + CUI, sin datos personales, con límite de consultas. Falta US-027 (resultados publicados) |
| Auditoría | `bitacora` · US-032 (requerimiento del PO) | 🟢 Middleware global: registra quién, qué, cuándo y con qué resultado, incluidos los rechazos · `bitacora.e2e-spec.ts` |
| Avisos al estudiante | `solicitudes` · US-034 (requerimiento del PO) | 🟢 Un aviso por cada cambio de estado, con el patrón Observer · `solicitudes.e2e-spec.ts` |
| Recuperación de contraseña | `usuarios` · US-035 | 🟢 Respuesta idéntica exista o no la cuenta, enlace de una hora y de un solo uso · `recuperacion-password.e2e-spec.ts` |

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
| **Estado** | 🟢 **Implementado y probado** (12 Sep) — `convocatoria.factory.spec.ts` |

| | **Builder** |
|---|---|
| **Problema real** | Los reportes combinan ocho filtros opcionales e independientes; un constructor único produce el anti-patrón telescópico |
| **Origen** | US-028, y US-030 para el formato de salida |
| **Alternativa descartada** | Objeto de configuración plano: no valida combinaciones incoherentes ni impide construir un reporte a medias |
| **Ubicación** | `modules/reportes/application/builders/reporte.builder.ts` |
| **Prueba que lo verifica** | Que `build()` rechace combinaciones inválidas de filtros — `reporte.builder.spec.ts` (fechas al revés, agrupar por lo mismo que se filtró, valores fuera de catálogo, inmutabilidad de lo construido) |
| **Sprint** | 7 · Responsable: Stuard |
| **Estado** | 🟢 **Implementado y probado** (16 Sep) |

### Estructurales

| | **Adapter** ✅ |
|---|---|
| **Problema real** | El dominio necesita verificar contraseñas y emitir sesiones sin depender de `bcryptjs` ni de `@nestjs/jwt`; y el enunciado anticipa integraciones con otras instituciones |
| **Origen** | US-002 · NFR de seguridad: *"las contraseñas deben almacenarse con hash"* |
| **Alternativa descartada** | Llamar a bcrypt dentro de la entidad: acopla el dominio y vuelve lentas las pruebas unitarias |
| **Ubicación** | `solicitudes/domain/ports/almacenamiento-documentos.ts` → `AlmacenamientoLocalAdapter` y `AlmacenamientoMemoriaAdapter` (US-013)<br>`usuarios/domain/ports/hasher-password.ts` → `BcryptHasherAdapter`<br>`usuarios/domain/ports/generador-token.ts` → `JwtGeneradorTokenAdapter`<br>`usuarios/domain/ports/usuario.repositorio.ts` → `UsuarioPrismaRepositorio` y `UsuarioEnMemoriaRepositorio` |
| **Prueba que lo verifica** | `autenticar-usuario.service.spec.ts` — 8 pruebas que corren con dobles, sin bcrypt real ni base de datos |
| **Sprint** | **1** (adelantado del 4: apareció el problema, no la fecha) |
| **Estado** | 🟢 **Implementado y probado** |

| | **Facade** |
|---|---|
| **Problema real** | Resolver una solicitud coordina colaboradores de cuatro módulos: dictámenes, cupos, transición de estado con su registro de auditoría y notificación (el acta llega con US-026) |
| **Origen** | US-023 |
| **Alternativa descartada** | Que el controlador orqueste los cuatro: filtra lógica de negocio a presentación y la duplica en cada punto de entrada |
| **Ubicación** | `modules/resoluciones/application/facades/resolucion.facade.ts` (módulo propio: dentro de `solicitudes` habría creado un ciclo con `evaluaciones`) |
| **Prueba que lo verifica** | Que una aprobación sin cupos disponibles falle sin dejar el expediente a medias — `casos-de-uso-resoluciones.spec.ts`, y la prueba de humo con tres aprobaciones simultáneas |
| **Sprint** | 6 · Responsable: Ivan |
| **Estado** | 🟢 **Implementado y probado** (16 Sep) |

### De comportamiento

| | **State** |
|---|---|
| **Problema real** | La solicitud recorre `BORRADOR → ENVIADA → EN_EVALUACION → APROBADA \| RECHAZADA → ADJUDICADA`, y cada estado permite operaciones distintas. Las transiciones ilegales deben ser **imposibles**, no solo desaconsejadas |
| **Origen** | US-012, US-014, US-023 |
| **Alternativa descartada** | Un `enum` con condicionales: la lógica queda dispersa y basta olvidar un `if` para corromper un expediente |
| **Ubicación** | `modules/solicitudes/domain/estados/` |
| **Prueba que lo verifica** | Que evaluar un borrador o adjudicar una solicitud rechazada lance excepción |
| **Sprint** | 4 · Responsable: Stuard |
| **Estado** | 🟢 **Implementado y probado** (16 Sep) — `estados-solicitud.spec.ts` prueba los 30 pares estado × acción |

| | **Strategy** |
|---|---|
| **Problema real** | Cada tipo de beca se puntúa distinto: mérito académico, necesidad socioeconómica o mixto. El enunciado advierte de cambios normativos durante el semestre |
| **Origen** | US-019 |
| **Alternativa descartada** | Fórmula configurable en base de datos: no es testeable unitariamente, y un cálculo que asigna fondos públicos debe estar versionado y auditado por code review |
| **Ubicación** | `modules/evaluaciones/domain/strategies/` |
| **Prueba que lo verifica** | Cada fórmula con sus casos límite, y que `CriterioMixto` componga las otras dos en vez de duplicarlas |
| **Ubicación real** | `criterio-merito-academico.ts`, `criterio-necesidad-socioeconomica.ts`, `criterio-mixto.ts` y `criterio-por-tipo-beca.ts` (qué tipo usa cuál) |
| **Sprint** | 5 · Responsable: Stuard |
| **Estado** | 🟢 **Implementado y probado** (16 Sep) — `criterios.spec.ts`, incluida la prueba de que el mixto compone y no copia |

| | **Observer** |
|---|---|
| **Problema real** | Un cambio de estado de la solicitud le interesa a varios receptores sin relación entre sí (el aviso al estudiante, el log del servidor y, a futuro, el correo), y ocurre en seis casos de uso distintos |
| **Origen** | US-034, requerimiento del Product Owner del 17 de octubre |
| **Alternativa descartada** | Que cada caso de uso llame a cada receptor: la lista queda copiada seis veces y un receptor nuevo obliga a tocar los seis |
| **Ubicación** | `modules/solicitudes/domain/events/evento-solicitud.ts` (contrato), `application/services/publicador-eventos.service.ts` (sujeto) e `infrastructure/notificaciones/notificador-estudiante.observador.ts` (observador) |
| **Prueba que lo verifica** | Que se avise después de guardar y que un aviso fallido no tumbe la operación — `casos-de-uso-solicitudes.spec.ts` y cuatro pruebas e2e del buzón en `solicitudes.e2e-spec.ts` |
| **Sprint** | 8 |
| **Estado** | 🟢 **Implementado y probado** (17 Oct) |

### Resumen del cumplimiento

| Categoría | Exigido | Implementados |
|---|---|---|
| Creacionales | 2 | **2** (Factory Method, Builder) ✅ |
| Estructurales | 2 | **2** (Adapter, Facade) ✅ |
| De comportamiento | 2 | **3** (State, Strategy, Observer) ✅ |

> Los siete están implementados y probados, cada uno en la historia donde apareció el problema
> que resuelve. Observer no estaba en el plan inicial: entró cuando el requerimiento del Product
> Owner planteó el problema.

---

## 3. Trazabilidad de los principios SOLID

| Principio | Dónde se puede verificar hoy |
|---|---|
| **S** — Responsabilidad única | `AutenticarUsuarioService` solo autentica: no registra, no notifica, no cambia perfiles |
| **O** — Abierto/cerrado | Un tipo de beca nuevo se agrega registrando una estrategia y una fábrica, sin modificar código existente. El estado `APROBACION_PENDIENTE` (US-033) entró como una clase nueva sin tocar los demás estados |
| **L** — Sustitución de Liskov | `UsuarioPrismaRepositorio` y `UsuarioEnMemoriaRepositorio` son intercambiables sin que el caso de uso cambie una línea. Lo demuestra la prueba unitaria |
| **I** — Segregación de interfaces | `HasherPassword` declara dos métodos, no una interfaz genérica de "servicios externos" |
| **D** — Inversión de dependencias | Los tres puertos de `usuarios` se enlazan en `usuarios.module.ts` con `provide`/`useClass` |

**Verificación automática:** la regla de capas no depende de que el revisor se acuerde. ESLint
rechaza cualquier import de `@nestjs/*`, `@prisma/client` o HTTP dentro de `domain/`, y el CI
bloquea el Pull Request. Comprobado provocando la violación a propósito.

---

## 4. Lo que no se implementó

| Historia | Objetivo afectado | Motivo |
|---|---|---|
| US-004 Gestión de perfil de la cuenta | 2 | No priorizada (Media) |
| US-009 Cerrar convocatoria | 1 | No priorizada (Media) |
| US-010 Editar convocatoria en borrador | 1 | No priorizada (Media) |
| US-022 Notificación por correo | 3 | US-034 cubre el aviso dentro del sistema; falta el canal de correo |
| US-026 Acta de resolución | 7 | No priorizada (Media) |
| US-027 Publicación de resultados | 8 | No priorizada (Baja) |
| Doble factor de autenticación | Transversal | Descartado por tiempo al planificar US-035 |

Los documentos de diseño (casos de uso, componentes y clases), los planes de calidad y de pruebas
y los dos manuales están terminados.

---

## 5. Cómo se mantiene esta matriz

- Se revisa en cada Sprint Planning, al decidir qué historias entran.
- Ningún patrón nuevo se implementa sin su fila completa: problema, origen, alternativa
  descartada, ubicación y prueba.
- El estado se actualiza al cerrar cada sprint, junto con la minuta.
- Si el Product Owner introduce un requisito nuevo, se agrega a la sección 1 antes de
  escribir código, y su análisis de impacto va al registro de `docs/05-arquitectura.md §5`.
