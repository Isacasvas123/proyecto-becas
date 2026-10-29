# Retrospectiva y Cierre — Sprint 8
### Plataforma Nacional para la Gestión Integral de Becas

> Se celebra a continuación de la [Sprint Review del Sprint 8](sprint-08-review.md). Es el último
> sprint: en lugar de un Planning, la segunda parte planifica el cierre hasta la entrega.

| | |
|---|---|
| **Fecha** | jueves 29/10/2026 · 19:00 a 19:45 |
| **Facilitador** | Isaac (Scrum Master) |
| **Asistentes** | Isaac · Ivan · Fernando · Stuard (los cuatro presentes) |

---

# PARTE 1 — SPRINT RETROSPECTIVE

> **Sin el Product Owner.** Se habla del proceso, no del producto.

## 1.1 Seguimiento de la acción de mejora anterior

| Acción acordada en la sesión consolidada | Responsable | ¿Se cumplió? |
|---|---|---|
| Antes de cerrar una historia con interfaz, otro integrante la ejecuta en Staging y deja captura en el Pull Request | Isaac | ☐ Sí ☐ No ☒ Parcialmente |

**Si no se cumplió, ¿por qué?** La revisión cruzada se hizo en todos los Pull Requests del cierre,
pero la captura de Staging solo quedó en los cambios de interfaz más grandes. En los cambios de
documentación no aplicaba.

## 1.2 ¿Qué salió bien?

| Quién | Qué salió bien |
|---|---|
| Isaac | Los cuatro abrimos y aprobamos Pull Requests en el cierre, con revisión cruzada |
| Ivan | Ningún despliegue a Staging falló durante el sprint |
| Fernando | DEF-01 quedó cerrado con pruebas de persistencia contra PostgreSQL (PR #39) |
| Stuard | El Manual de Usuario quedó al día con lo que de verdad hace la plataforma |

## 1.3 ¿Qué nos estorbó?

| Quién | Qué estorbó | ¿Es un impedimento recurrente? |
|---|---|---|
| Isaac | Las ceremonias se agruparon en sesiones largas en lugar de celebrarse cada jueves | ☒ Sí ☐ No |
| Ivan | Staging borra los documentos subidos en cada despliegue: el disco del plan gratuito no se conserva | ☒ Sí ☐ No |
| Fernando | Poco margen entre la revisión y el merge en los últimos días | ☐ Sí ☒ No |
| Stuard | Al pegar las secciones nuevas del manual quedaron errores de formato que hubo que corregir | ☐ Sí ☒ No |

## 1.4 Revisión de calidad

- ¿Todas las historias marcadas como completadas cumplían realmente el DoD? ☒ Sí ☐ No
- ¿Todos los PR tuvieron code review con comentarios sustantivos? ☒ Sí ☐ No
- ¿Alguien hizo push directo a `develop` o `main`? ☒ No ☐ Sí
- ¿Se escribieron pruebas para todo el código nuevo? ☒ Sí ☐ No
- Cobertura al cierre del sprint: 91.83 % *(última medición, 21 de octubre)*
- Bugs detectados durante el sprint: 3 — el botón de la segunda firma que no se habilitaba (DEF-07,
  corregido en el PR #34), el borrado de documentos en cada despliegue de Staging y los errores de
  formato del manual (corregidos en el PR #43)

## 1.5 Acción de mejora

> El proyecto termina con este sprint, así que la acción mira a la defensa y a quien continúe el
> sistema.

**Acción:** para la defensa, subir los documentos de la demostración el mismo día y no mergear nada a
`develop` entre el ensayo y la clase. Para quien continúe el sistema, el almacenamiento de documentos
debe pasar a un servicio externo; el puerto `AlmacenamientoDocumentos` ya lo permite.
**Responsable:** Ivan
**Cómo sabremos que se cumplió:** la demostración del 31 de octubre se hace con documentos subidos ese
día y el registro de despliegues de Render no muestra ninguno entre el ensayo y la defensa.

---

# PARTE 2 — CIERRE DEL PROYECTO

## 2.1 Lo que queda hasta la entrega

| Tarea | Responsable | Fecha |
|---|---|---|
| Ensayo completo de la presentación y la demostración, dos vueltas con cronómetro | Los cuatro | viernes 30/10/2026 |
| Subir la presentación a Canva y revisar que no se mueva nada | Isaac | viernes 30/10/2026 |
| Preparar las cuatro sesiones de la demostración y los documentos de prueba | Stuard y Fernando | sábado 31/10/2026, antes de la clase |
| Despertar Staging diez minutos antes de exponer | Ivan | sábado 31/10/2026 |
| Defensa y entrega | Los cuatro | sábado 31/10/2026 |

## 2.2 Reparto en la defensa

| Integrante | Presentación | Demostración |
|---|---|---|
| Isaac | Apertura, Seguimiento Scrum y cierre | — |
| Stuard | Qué resuelve y patrones de diseño | Estudiante: postulación, aviso y consulta pública |
| Ivan | Arquitectura | Segunda aprobación |
| Fernando | Calidad y seguridad | Evaluador y primera aprobación |

## 2.3 Riesgos del cierre

| Riesgo | Impacto | Mitigación | Responsable |
|---|---|---|---|
| Staging tarda en responder al abrirlo | Medio | Abrirlo diez minutos antes | Ivan |
| Un despliegue borra los documentos de la demo | Alto | No mergear nada hasta después de la defensa | Isaac |
| Falla el internet del salón | Medio | Capturas en la diapositiva de la demostración y teléfono como punto de acceso | Equipo |

## 2.4 Confirmación final

- [x] Cada integrante confirmó qué le toca en el ensayo y en la defensa
- [x] Todos conocen el escenario de la demostración
- [x] Las historias del Product Backlog quedaron en su estado final
- [x] El alcance final quedó declarado en la sesión consolidada del 27 de octubre

---

**Minuta elaborada por:** Isaac Castillo (Scrum Master) · **Fecha de publicación en el repositorio:** 29/10/2026
