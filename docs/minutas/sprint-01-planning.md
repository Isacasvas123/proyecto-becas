# Minuta — Reunión de Arranque y Sprint Planning 1
### Plataforma Nacional para la Gestión Integral de Becas

> Llenar **durante** la reunión, no después. Subir al repositorio el mismo jueves con una rama
> `docs/minuta-sprint-01`.

| | |
|---|---|
| **Fecha** | 3 de septiembre de 2026 |
| **Hora inicio / fin** | __:__ / __:__ |
| **Facilitador** | Isaac (Scrum Master) |
| **Product Owner** | Ing. Mario Fuentes — **no asiste** (reunión interna del equipo) |
| **Asistentes** | Isaac ☐ · Ivan ☐ · Fernando ☐ · Stuard ☐ |
| **Toma notas** | ________________ |

---

## 1. Decisiones tomadas

| Decisión | Acuerdo |
|---|---|
| Nombre del equipo | `_______________________________` |
| Plataforma de comunicación | `_______________________________` |
| Tiempo máximo de respuesta | 12 horas en día hábil ☐ · otro: ______ |
| Stack técnico | NestJS + React + PostgreSQL, TypeScript ☐ confirmado · ☐ se discute |
| Turnos de trabajo | ☐ confirmados tal cual · ☐ con cambios (detallar abajo) |
| **Proxy Product Owner** | ☐ Stuard · ☐ otro: `______________` |
| Registro de la aceptación | Mover la tarjeta a *Done* en GitHub Projects — solo lo hace el Proxy PO |

> El **Product Owner sigue siendo el Ing. Fuentes**. El Proxy solo verifica el cumplimiento de los
> criterios de aceptación ya escritos; no cambia alcance ni prioridades.

**Cambios a los turnos, si los hubo:**

`_______________________________________________________________________`

---

## 2. Accesos al repositorio

| Integrante | Usuario de GitHub | Invitado ☐ | Aceptó ☐ |
|---|---|---|---|
| Ivan | `________________` | ☐ | ☐ |
| Fernando | `________________` | ☐ | ☐ |
| Stuard | `________________` | ☐ | ☐ |

---

## 3. Sanciones acordadas (Anexo 3, §6)

El equipo debe **elegir** las consecuencias por incumplimiento grave persistente. Marcar:

- [ ] Reducción proporcional del porcentaje de contribución declarado, calculado sobre los
      Puntos de Historia efectivamente completados
- [ ] Asignación de tareas adicionales para compensar al equipo
- [ ] Reporte formal al docente con la evidencia documentada

**Firmas recogidas en `02-politica-equipo.md`:** Isaac ☐ · Ivan ☐ · Fernando ☐ · Stuard ☐

---

## 4. Presentación del trabajo previo

Isaac mostró el esqueleto técnico y el inicio de sesión ya construidos, corriendo en local.

**Reacción del equipo y acuerdos:**

`_______________________________________________________________________`

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

☐ Aceptado tal cual ☐ Modificado: `_______________________________`

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
| Feriados 15 Sep y 20 Oct caen martes (turno de Ivan y Stuard) | Pierden su día de trabajo | Mueven su turno al domingo esas semanas | Ivan, Stuard |
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

- [ ] Cada quien confirmó en voz alta su tarea y su fecha
- [ ] Todos entraron al canal de comunicación
- [ ] Todos aceptaron la invitación al repositorio
- [ ] Todos instalaron Node, Docker, Git y VS Code

**Próxima reunión:** jueves 10 de septiembre de 2026, __:__

**Minuta elaborada por:** ____________ · **Publicada en el repositorio el:** ___/___/2026
