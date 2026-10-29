# Minuta de Sprint Review — Sprint 8
### Anexo 2 · Plataforma Nacional para la Gestión Integral de Becas

> Último sprint del proyecto. Cierra el cronograma del Acta de Constitución y deja el producto
> listo para la entrega del 31 de octubre.

---

## Información General

| | |
|---|---|
| **Nombre del Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Número de Sprint** | 8 |
| **Período del Sprint** | jueves 22/10/2026 al miércoles 28/10/2026 |
| **Fecha de la Reunión** | jueves 29/10/2026 |
| **Hora de inicio / fin** | 18:00 / 19:00 |

**Asistentes**

- Product Owner: Ing. Mario Fuentes — no asistió: sesión interna del equipo. El incremento se le presenta en la defensa del 31 de octubre
- Proxy Product Owner: Stuard Estrada
- Scrum Master: Isaac Castillo
- Development Team: Ivan García · Fernando Herrera
- Stakeholders invitados: ninguno

---

## 1. Objetivo del Sprint (Sprint Goal)

**Declaración:** incorporar los requerimientos que el Product Owner presentó el 17 de octubre,
completar la seguridad de las cuentas y dejar el producto y la documentación listos para la entrega.

**¿Se cumplió?** ☒ Sí completamente ☐ Parcialmente ☐ No

---

## 2. Revisión de los Ítems del Product Backlog Completados

| User Story / Ítem | Puntos | Estado Final | Notas y Observaciones |
|---|---|---|---|
| US-033 — Como administración, quiero que las becas de más de Q10,000 requieran dos aprobaciones de personas distintas, para evitar que una sola persona comprometa montos altos | 8 | ☒ Completado ☐ No completado | PR #27 y PR #34. Verificada en Staging el 27 de octubre con dos administradores |
| US-034 — Como estudiante, quiero recibir un aviso cada vez que mi solicitud cambia de estado, para saber en qué va sin preguntar | 5 | ☒ Completado ☐ No completado | PR #27. Implementada con el patrón Observer |
| US-035 — Como usuario, quiero recuperar mi contraseña olvidada, para no depender del Ministerio | 8 | ☒ Completado ☐ No completado | PR #34. En Staging el enlace se escribe en el registro del servidor |
| US-036 — Como evaluador, quiero ver los documentos sin descargarlos, para revisarlos en la misma pantalla donde dictamino | 3 | ☒ Completado ☐ No completado | PR #37. Verificada en Staging el 28 de octubre |
| DEF-01 — Pruebas de persistencia contra PostgreSQL | — | ☒ Completado ☐ No completado | PR #39 (Fernando). Cierra el issue #6 abierto en el Sprint 1 |

**Total de Puntos de Historia comprometidos:** 24
**Total de Puntos de Historia completados:** 24
**Velocidad del sprint:** 24 puntos

Además de las historias se integraron cinco Pull Requests de cierre: limpieza de `.env.example`
(PR #40, Ivan), Manual de Usuario al día (PR #41 y #43, Stuard), comentarios del código (PR #38) y
la documentación final (PR #42).

**Historias no completadas — motivo y destino:**

| US | Por qué no se completó | Qué falta | ¿Regresa al backlog? |
|---|---|---|---|
| Ninguna | — | — | — |

---

## 3. Demostración del Incremento del Producto

**Funcionalidad demostrada:**

1. Beca de Q15,000: la primera aprobación la deja en Aprobación pendiente y la segunda, de otra
   persona, la aprueba y ocupa el cupo
2. Bandeja Mis avisos del estudiante, con un aviso por cada cambio de estado
3. Recuperación de contraseña de principio a fin
4. Visor de documentos en la pantalla del evaluador

**Responsable(s) de la demo:** Stuard (estudiante), Fernando (evaluador y primera aprobación), Ivan
(segunda aprobación) e Isaac (recuperación de contraseña)

**Entorno usado:** ☒ Staging ☐ Local

**Resumen de la demostración:**

Se recorrió el mismo escenario que se presentará en la defensa. Funcionó de punta a punta. Durante
la preparación se encontró que Staging borra los documentos subidos cada vez que se despliega,
porque el disco del plan gratuito no se conserva; el visor mostraba error con los documentos
anteriores al último despliegue. Con documentos recién subidos funciona. Para la defensa se acordó
subirlos en vivo.

---

## 4. Feedback de los Stakeholders y del Product Owner

| Quién | Comentario / Sugerencia / Pregunta | Tipo |
|---|---|---|
| Fernando | El visor ahorra abrir cada archivo por separado al dictaminar | ☐ Mejora ☐ Pregunta ☒ Positivo ☐ Defecto |
| Ivan | Los documentos se pierden en cada despliegue de Staging; hace falta un almacenamiento externo si el sistema sigue en uso | ☐ Mejora ☐ Pregunta ☐ Positivo ☒ Defecto |
| Stuard | Al agregar las secciones nuevas al manual quedaron tres errores de formato; se corrigieron en el PR #43 | ☐ Mejora ☐ Pregunta ☐ Positivo ☒ Defecto |
| Isaac | ¿Conviene mostrar la recuperación de contraseña en la defensa si el enlace sale en el registro del servidor? Se decidió no incluirla en los diez minutos | ☐ Mejora ☒ Pregunta ☐ Positivo ☐ Defecto |

**¿El Product Owner emitió algún cambio de requerimiento?** ☐ Sí ☒ No

---

## 5. Análisis y Adaptación del Product Backlog

**Nuevos ítems sugeridos para el Product Backlog:**

- [ ] Almacenamiento de documentos en un servicio externo. El puerto ya existe; es un adaptador nuevo
- [ ] Envío del correo de recuperación por un servidor SMTP real

**Repriorización de ítems existentes:** no hay. El alcance quedó cerrado en la sesión consolidada del
27 de octubre y este sprint no lo amplió.

**Discusión sobre el contexto:** el producto cubre los nueve objetivos del enunciado y los tres
requerimientos del 17 de octubre. Los dos ítems nuevos son de infraestructura y no cambian ninguna
regla de negocio, porque el diseño por puertos permite agregarlos sin tocar el dominio.

---

## 6. Conclusiones y Próximos Pasos

**Resumen general:**

Sprint cumplido. Las cuatro historias comprometidas están en Done y verificadas en Staging, DEF-01
quedó cerrado y los cuatro integrantes tienen Pull Requests propios aprobados por otro compañero en
este cierre. El proyecto termina con 29 de las 36 historias del backlog entregadas, 195 puntos en
ocho sprints y siete patrones de diseño implementados.

**Estado de los entregables documentales del sprint:**

| Documento | Estado |
|---|---|
| Manual Técnico | ☒ Al día ☐ Pendiente |
| Manual de Usuario | ☒ Al día ☐ Pendiente |
| Documento final de entrega | ☒ Al día ☐ Pendiente |
| Presentación Final | ☒ Al día ☐ Pendiente |

**Próximas reuniones**

- Sprint Retrospective y cierre: hoy, a continuación — ver [`sprint-08-retro-cierre.md`](sprint-08-retro-cierre.md)
- Ensayo de la defensa: viernes 30/10/2026
- Defensa y entrega: sábado 31/10/2026

---

**Minuta elaborada por:** Isaac Castillo (Scrum Master) · **Fecha de publicación en el repositorio:** 29/10/2026
