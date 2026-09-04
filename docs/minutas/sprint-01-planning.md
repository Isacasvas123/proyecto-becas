# Minuta — Reunión de Arranque y Sprint Planning 1
### Plataforma Nacional para la Gestión Integral de Becas

> Llenar **durante** la reunión, no después. Subir al repositorio el mismo jueves con una rama
> `docs/minuta-sprint-01`.

| | |
|---|---|
| **Fecha** | 3 de septiembre de 2026 |
| **Hora inicio / fin** |09:30 PM / 10:30 PM_ |
| **Facilitador** | Isaac (Scrum Master) |
| **Product Owner** | Ing. Mario Fuentes — **no asiste** (reunión interna del equipo) |
| **Asistentes** | Isaac SI · Ivan SI · Fernando SI · Stuard SI  |
| **Toma notas** | Todos asistieron_ |

---

## 1. Decisiones tomadas

| Decisión | Acuerdo |
|---|---|
| Nombre del equipo | `ControlExe` |
| Plataforma de comunicación | `Whatsapp` |
| Tiempo máximo de respuesta | 12 horas en día hábil SI · otro: ______ |
| Stack técnico | NestJS + React + PostgreSQL, TypeScript - CONFIRMADO |
| Turnos de trabajo | CONFIRMADOS **con un cambio**: lunes y martes se intercambian |
| **Proxy Product Owner** | Stuard Estrada |
| Registro de la aceptación | Mover la tarjeta a *Done* en GitHub Projects — solo lo hace el Proxy PO |

> El **Product Owner sigue siendo el Ing. Fuentes**. El Proxy solo verifica el cumplimiento de los
> criterios de aceptación ya escritos; no cambia alcance ni prioridades.

**Cambios a los turnos:**

Se intercambiaron los turnos de lunes y martes respecto a la propuesta inicial:

| Día | Propuesta original | **Acordado** |
|---|---|---|
| Viernes | Isaac + Ivan | Isaac + Ivan *(sin cambio)* |
| Sábado | Fernando + Stuard | Fernando + Stuard *(sin cambio)* |
| Lunes | Isaac + Fernando | **Stuard + Fernando** |
| Martes | Ivan + Stuard | **Ivan + Isaac** |

> ⚠️ **Consecuencia a revisar en la Retrospectiva.** Con estos turnos las parejas quedan fijas:
> Isaac trabaja siempre con Ivan, y Fernando siempre con Stuard. Los code reviews serán siempre
> entre los mismos, y las dos mitades del equipo no llegarán a conocer el trabajo de la otra.
> Eso choca con el compromiso de que **cualquiera de los cuatro pueda defender cualquier parte**
> del proyecto ante el catedrático.
>
> Mitigación posible sin cambiar los días de nadie: que en cada sprint el revisor del Pull
> Request sea alguien de la otra pareja, aunque no coincidan en el mismo día.

---

## 2. Accesos al repositorio

| Integrante | Usuario de GitHub | Invitado ☐ | Aceptó ☐ |
|---|---|---|---|
| Ivan | `joseivan28gc` | ✅ | ✅ |
| Fernando | `Keller33` | ✅ | ✅ |
| Stuard | `Stuard20` | ✅ | ✅ |

---

## 3. Sanciones acordadas (Anexo 3, §6)

El equipo debe **elegir** las consecuencias por incumplimiento grave persistente. Marcar:

- [x] Reducción proporcional del porcentaje de contribución declarado, calculado sobre los
      Puntos de Historia efectivamente completados
- [x] Asignación de tareas adicionales para compensar al equipo
- [x] Reporte formal al docente con la evidencia documentada

**Firmas recogidas en `02-politica-equipo.md`:** Isaac ✅ · Ivan ✅ · Fernando ✅ · Stuard ✅

---

## 4. Presentación del trabajo previo

Isaac mostró el esqueleto técnico y el inicio de sesión ya construidos, corriendo en local.

**Reacción del equipo y acuerdos:**

`Les gustó y les pareció correcto, sin cambios proporcionales antes de la revision del Walking Skeleton por fernando`

`_______________________________________________________________________`

**Objeciones o cambios que el equipo quiere hacerle:**

| Quién | Qué observó | ¿Se acepta? |
|---|---|---|
| | | |
| | | |

---

## 5. Sprint Goal

> **"Dejar el equipo constituido y con acceso, el repositorio funcionando con su flujo de
> trabajo, y el esqueleto técnico revisado, entendido y aprobado por el equipo."**

✅ Aceptado tal cual ☐ Modificado: `_______________________________`

---

## 6. Sprint Backlog 1 — asignación por consenso

| # | Tarea | Pts | Responsable acordado |
|---|---|---|---|
| S1-01 | Acta de Constitución completa y firmada | 3 | ____________ |
| S1-02 | Política de Trabajo firmada, con sanciones acordadas | 2 | ____________ |
| S1-03 | Invitar a los 3 al repositorio y que acepten | 1 | ____________ |
| S1-04 | Tablero en GitHub Projects con el backlog cargado | 2 | ____________ |
| S1-05 | Estudiar el walking skeleton, criticarlo y abrir su PR | 8 | ____________ |
| S1-06 | Revisar el PR del skeleton con comentarios reales | 2 | ____________ |
| S1-07 | Revisar y hacer propia la configuración de Git y CI | 3 | ____________ |
| S1-08 | Revisar el Documento de Arquitectura y firmarlo o corregirlo | 5 | ____________ |
| S1-09 | Revisar la Visión del Producto y las User Personas | 3 | ____________ |
| S1-10 | Revisar y priorizar el Product Backlog con el equipo | 5 | ____________ |
| S1-11 | Definition of Done acordada y publicada | 1 | Todos |
| S1-12 | Corregir los 3 defectos detectados en el esqueleto | 5 | ____________ |

**Total comprometido:** ______ puntos *(propuesta inicial: 40)*

**Historias que el equipo decidió sacar del sprint:**

`_______________________________________________________________________`

---

## 7. Riesgos e impedimentos identificados

| Riesgo | Impacto | Mitigación acordada | Responsable |
|---|---|---|---|
| Protección de `main` bloqueada hasta que active GitHub Pro | La regla depende de disciplina, no del sistema | Se activa en cuanto entren los beneficios (≈5 Sep) | Isaac |
| Feriados 15 Sep y 20 Oct caen martes (turno de Ivan e Isaac) | Pierden su día de trabajo | Mueven su turno al domingo esas semanas | Ivan, Isaac |
| Docker Desktop falla sin WSL en Windows 11 Home | Bloquea a quien no lo tenga | `wsl --install` como administrador y reiniciar | Cada uno |
| | | | |

---

## 8. Acuerdos sobre el orden de los Pull Requests

1. **Primero** `feature/S1-08-walking-skeleton` → `develop`
2. **Después** `feature/US-002-inicio-sesion` → `develop`

Motivo: la segunda rama está construida sobre la primera; invertir el orden ensucia el historial.

☐ El equipo lo entendió y lo acepta

---

## 9. Próximos pasos

- [x] Cada quien confirmó en voz alta su tarea y su fecha
- [x] Todos entraron al canal de comunicación
- [x] Todos aceptaron la invitación al repositorio
- [x] Todos instalaron Node, Docker, Git y VS Code

**Próxima reunión:** jueves 10 de septiembre de 2026, __:__

**Minuta elaborada por:** Isaac Castillo· **Publicada en el repositorio el:** 03/09/2026
