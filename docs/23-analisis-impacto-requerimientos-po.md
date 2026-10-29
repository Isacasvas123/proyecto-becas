# Análisis de impacto — requerimientos del Product Owner del 17 de octubre

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Equipo** | ControlExe |
| **Autor** | Isaac (Scrum Master), con el equipo |
| **Fecha** | 20 de octubre de 2026 · **Versión** 1.0 |

> Este documento responde a una pregunta concreta: **¿qué costó meter tres requerimientos nuevos
> cuando el producto ya estaba terminado?** No es una justificación del diseño —eso está en
> `05-arquitectura.md` y `06-patrones.md`— sino la medición de lo que pasó cuando el diseño se
> puso a prueba de verdad.

---

## 1. Qué pidió el Product Owner

En la sesión del 17 de octubre de 2026, con las 24 historias planificadas ya terminadas y
verificadas en Staging, el Product Owner presentó tres requerimientos nuevos:

| # | Requerimiento |
|---|---|
| **R1** | Las solicitudes de beca con monto mayor a **Q10,000** deben requerir una **segunda aprobación**. |
| **R2** | Cuando una solicitud cambie de estado, el sistema deberá **registrar el evento** y **generar una notificación** para el estudiante. |
| **R3** | Cada **aprobación, rechazo o modificación relevante** debe registrar **quién** la hizo, **cuándo**, **qué operación** fue y **qué resultado** tuvo. |

Se incorporaron al backlog como US-033 (R1), US-034 (R2) y US-032 (R3; esta última ya
venía exigida desde antes por la observación del docente sobre la bitácora).

---

## 2. Lo que hubo que decidir antes de programar

Ninguno de los tres requerimientos venía completamente especificado. Estas son las decisiones que
el equipo tomó, con su razón, para que el Product Owner pueda confirmarlas o corregirlas en la
Review.

**R1 · ¿De dónde sale el monto de la beca?** El requerimiento habla de solicitudes con monto mayor
a Q10,000, pero hasta ahora ninguna solicitud tenía monto. Se decidió que **el monto lo define la
convocatoria** y queda copiado en la solicitud al crearla. La alternativa —que cada estudiante
pidiera un monto— cambiaría el producto: convertiría la postulación en una negociación y obligaría
a revisar US-012 entera. Copiar el monto en la solicitud, en vez de consultarlo siempre desde la
convocatoria, evita además que editar una convocatoria altere las reglas de solicitudes que ya
estaban en trámite.

**R1 · ¿Quién da la segunda aprobación?** El requerimiento no lo dice. Se decidió que **debe ser
una persona distinta de la primera**, porque de lo contrario el control no controla nada: el mismo
administrador daría dos clics y el resultado sería idéntico a hoy. Queda escrito como regla de
dominio y probado.

**R1 · ¿Se reserva el cupo con la primera aprobación?** Se decidió que no. Reservarlo dejaría
cupos retenidos por aprobaciones a medio terminar, que es justo el problema que US-023 resolvió con
el control atómico de cupos. El cupo se reserva al confirmar la segunda.

**R2 · ¿Qué es una notificación?** Se implementó como aviso dentro del sistema, con su pantalla
de buzón, no como correo electrónico. El correo es US-022, que sigue en el backlog: cuando se haga,
será un observador más y no tocará nada de lo que ya existe.

**R3 · ¿Qué es una modificación relevante?** La lectura literal —anotar a mano cada operación
importante— deja el registro a criterio de quien programa: el día que alguien agregue un endpoint y
olvide la línea, esa operación deja de auditarse y nadie se entera. Se decidió lo contrario: **se
registra automáticamente todo lo que cambia algo** y se excluyen solo las lecturas. Así la
cobertura no depende de que nadie se olvide.

---

## 3. Qué costó, medido

| | R1 · US-033 | R2 · US-034 | R3 · US-032 |
|---|---|---|---|
| Archivos nuevos | 2 | 9 | 14 |
| Migraciones de base de datos | 1 | 1 | 1 |
| Patrones nuevos | ninguno (reutiliza **State**) | **Observer** | ninguno (middleware) |
| Pruebas agregadas | 7 e2e + la tabla de estados ampliada | 4 e2e + dobles en 2 specs | 9 e2e + unitarias |
| Líneas de código y pruebas | 1,555 entre los dos | | 1,243 |

R1 y R2 se trabajaron juntos y comparten archivos modificados —la entidad `Solicitud`, el
módulo de solicitudes, el repositorio, la plataforma de pruebas—, así que separar el conteo de
modificaciones entre los dos daría un número inventado. Medido en conjunto: **49 archivos de
código y pruebas modificados**. R3 modificó 10.

**Total de los tres requerimientos:** alrededor de 2,800 líneas de código y pruebas, sin contar
la documentación.

**Estado de la suite al 20 de octubre de 2026:** **493 pruebas unitarias en 31 suites, todas en
verde (medido hoy, 65 segundos). Las 156 pruebas e2e** quedaron en verde en la última ejecución
de CI; no se volvieron a correr en local hoy porque necesitan el contenedor de PostgreSQL
levantado.

---

## 4. El dato que importa: qué **no** hubo que cambiar

Esta es la parte que vale la pena mirar, porque es donde se ve si las decisiones de diseño de los
sprints anteriores sirvieron para algo o solo fueron adorno académico.

**R1 no obligó a tocar ningún estado existente.** Agregar `APROBACION_PENDIENTE` fue **escribir una
clase nueva** (`EstadoAprobacionPendiente`) y sumarla al mapa de constructores. `EstadoBorrador`,
`EstadoEnviada`, `EstadoAprobada`, `EstadoRechazada` y `EstadoAdjudicada` quedaron idénticos.
Esto es exactamente lo que el documento de patrones prometió en el Sprint 4 —*agregar un estado
nuevo es agregar una clase*— y es la primera vez que se puede comprobar en lugar de afirmarlo.

Con la alternativa que se descartó entonces (un `enum` con condicionales), este requerimiento
habría obligado a encontrar y revisar cada `if` sobre el estado repartido por el dominio, sin
ninguna garantía de haberlos encontrado todos.

**R2 no obligó a tocar los casos de uso más de una línea cada uno.** El cambio de estado ocurre en
seis lugares: crear, enviar, pasar a evaluación, aprobar, confirmar la segunda aprobación y
adjudicar. Con Observer, cada uno ganó exactamente una línea:
`await this.eventos.publicarDe(solicitud)`. El correo de US-022 y cualquier integración futura
serán una clase nueva y un renglón en la fábrica del módulo; ningún caso de uso cambiará.

**R3 no obligó a tocar ningún caso de uso.** La bitácora es un middleware global: ni un solo
controlador, servicio o entidad la menciona. Un endpoint que se agregue mañana queda auditado sin
que su autor haga nada, que era precisamente el objetivo.

**La arquitectura por capas aguantó.** Las reglas de `no-restricted-imports` (ADR-08) rechazaron un
atajo durante este trabajo: el servicio de notificaciones inyectaba `PrismaService` directamente
desde la capa de aplicación. Hubo que introducir el puerto `NOTIFICACION_REPOSITORIO` con sus dos
adaptadores. El lint hizo de revisor antes que cualquier persona.

---

## 5. Lo que sí dolió

Decir que todo encajó sin fricción sería falso. Dos cosas costaron más de lo previsto.

**La bitácora como interceptor no funcionaba.** La primera implementación fue un interceptor
global, que es lo que parece natural en NestJS. No registraba ningún 403: en NestJS los *guards*
corren antes que los interceptores, así que una petición rechazada por permisos nunca llegaba
al registro —justo el caso que más interesa auditar. Hubo que rehacerla como middleware enganchado
al evento `finish` de la respuesta. Queda documentado como ADR-09 para que nadie lo corrija de
vuelta.

**Las convocatorias que ya existían no tienen monto.** El monto es obligatorio para las
convocatorias nuevas, pero las filas que ya estaban en la base de datos quedaron en 0. La entidad
acepta 0 al reconstruirse desde la base y lo exige mayor que 0 solo en la fábrica. Es una concesión
deliberada y está comentada en el código: sin ella, la migración habría dejado la aplicación sin
poder leer sus propios datos.

---

## 6. Trazabilidad

| Requerimiento | Historia | Dónde vive | Prueba que lo fija |
|---|---|---|---|
| R1 · segunda aprobación sobre Q10,000 | US-033 | `solicitudes/domain/estados/estados-solicitud.ts`, `shared/reglas/montos.ts` | 7 pruebas e2e en `resoluciones.e2e-spec.ts` |
| R1 · la segunda la da otra persona | US-033 | `solicitudes/domain/entities/solicitud.entity.ts` | e2e: el mismo administrador recibe error |
| R2 · registrar el evento | US-034 | `solicitudes/domain/events/evento-solicitud.ts` | `solicitudes-para-resolucion.service.spec.ts` |
| R2 · notificar al estudiante | US-034 | `infrastructure/notificaciones/notificador-estudiante.observador.ts` | 4 pruebas e2e del buzón |
| R2 · no avisar de lo que no se guardó | US-034 | `application/services/publicador-eventos.service.ts` | *lo que no se guarda no se anuncia* |
| R3 · quién, cuándo, qué y con qué resultado | US-032 | `modules/bitacora/presentation/bitacora.middleware.ts` | 9 pruebas e2e en `bitacora.e2e-spec.ts` |
| R3 · también lo rechazado | US-032 | el mismo middleware | e2e: un 403 queda registrado |
| R3 · el historial por solicitud | US-016 (ya existía) | `solicitud.entity.ts` | e2e del ciclo completo |

> **Nota sobre R3.** Este requerimiento quedó cubierto por **dos mecanismos distintos y
> complementarios**: la bitácora registra toda operación del sistema, y el historial de la
> solicitud (US-016, del Sprint 4) ya registraba cada transición con su autor y su motivo. El
> historial es lo que ve el estudiante; la bitácora es lo que ve el auditor.

---

## 7. Lo que falta

- [x] Aplicar las tres migraciones en Staging: se aplican solas al arrancar la imagen.
- [x] Verificar US-032, US-033 y US-034 en Staging.
- [ ] Confirmar con el Product Owner las cuatro decisiones de la sección 2.
- [ ] Definir el monto de las convocatorias que ya existen en Staging, hoy en 0.
- [ ] US-022 (correo) sigue pendiente: será el segundo observador.
