## Historia de usuario

<!-- Ej: US-012 — Crear solicitud. Enlaza el ítem del tablero. -->

**ID:** US-___
**Sprint:** ___

## Qué resuelve este PR

<!-- Dos o tres líneas. Qué problema atacaba y cómo lo resolviste.
     Si tomaste una decisión de diseño no obvia, explícala aquí:
     este texto es lo que el revisor lee antes que el código. -->

## Cómo probarlo

<!-- Pasos concretos para que el revisor lo verifique, no solo "correr los tests".
     1. ...
     2. ...
     Resultado esperado: ... -->

## Patrón de diseño aplicado

<!-- Si este PR introduce o modifica un patrón, indícalo y enlaza la sección
     correspondiente de docs/06-patrones.md. Si no aplica, escribe "Ninguno". -->

---

## Definition of Done

- [ ] Se cumplen **todos** los criterios de aceptación de la historia
- [ ] Pruebas unitarias escritas y en verde
- [ ] La suite completa pasa (`npm test`) — no rompí nada existente
- [ ] El linter pasa sin advertencias (`npm run lint`)
- [ ] Respeté la regla de dependencia: **nada de `domain/` importa framework, ORM ni HTTP**
- [ ] Documentación técnica creada o actualizada
- [ ] Probado en local siguiendo los pasos de arriba

> Los dos últimos puntos del DoD —despliegue en Staging y verificación del Product Owner— se
> completan después del merge a `develop`, no en este PR.

## Para el revisor

- [ ] Revisé el código, no solo el título del PR
- [ ] Dejé al menos un comentario sustantivo (una pregunta cuenta)
- [ ] Verifiqué que las pruebas cubren la lógica de negocio, no solo el camino feliz
- [ ] La arquitectura en capas se respeta

<!-- Recordatorio: el enunciado evalúa la calidad del repositorio. Un PR aprobado en
     treinta segundos sin un solo comentario se nota en el historial. -->
