# Guía de Git para el equipo

Para Isaac, Ivan, Fernando y Stuard. Si nunca has trabajado con ramas y Pull Requests, lee esto
completo una vez. Después úsalo como referencia.

> **Por qué importa:** el enunciado del proyecto evalúa explícitamente la *calidad del
> repositorio Git*. No es burocracia — es parte de la nota.

---

## Configuración inicial (solo una vez, cada quien en su máquina)

### 1. Decir quién eres

```bash
git config --global user.name "Tu Nombre Completo"
```

```bash
git config --global user.email "tucorreo@ejemplo.com"
```

> Usa el **mismo correo** que tienes en tu cuenta de GitHub. Si no coincide, tus commits no se
> asocian a tu perfil y parecerá que no trabajaste. Esto importa: el catedrático puede ver la
> gráfica de contribuciones por persona.

### 2. Descargar el proyecto

```bash
git clone https://github.com/USUARIO/proyecto-becas.git
```

```bash
cd proyecto-becas
```

### 3. Preparar el entorno

```bash
cp .env.example .env
```

```bash
docker compose up -d
```

```bash
npm install
```

---

## El ciclo de trabajo (esto es lo que repites siempre)

Cada historia de usuario sigue estos seis pasos.

### Paso 1 — Partir de develop actualizado

```bash
git checkout develop
```

```bash
git pull
```

> **Nunca te saltes el `pull`.** Si partes de una versión vieja, tu rama va a tener conflictos
> al integrarse.

### Paso 2 — Crear tu rama

```bash
git checkout -b feature/US-012-crear-solicitud
```

Formato del nombre: `feature/US-XXX-descripcion-corta`, todo en minúsculas y con guiones.

| Tipo de trabajo | Prefijo | Ejemplo |
|---|---|---|
| Nueva funcionalidad | `feature/` | `feature/US-012-crear-solicitud` |
| Corrección de error | `fix/` | `fix/validacion-documentos-vacios` |
| Solo documentación | `docs/` | `docs/minuta-sprint-02` |

### Paso 3 — Trabajar y guardar avances

Trabaja normalmente. Cuando termines una parte con sentido propio, guárdala:

```bash
git status
```

Te muestra qué cambiaste. Luego agregas los archivos:

```bash
git add .
```

Y creas el commit:

```bash
git commit -m "feat(solicitudes): agregar creacion de solicitud en estado borrador"
```

**Haz commits pequeños y frecuentes**, no uno gigante al final. Un commit por idea completa.
Un historial de 15 commits que cuentan una historia vale más que uno solo llamado "cambios".

#### Formato del mensaje de commit

```
tipo(modulo): descripcion en minusculas, en presente
```

| Tipo | Cuándo se usa |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un error |
| `test` | Pruebas |
| `docs` | Documentación |
| `refactor` | Reorganizar código sin cambiar comportamiento |
| `chore` | Configuración, dependencias, tareas de mantenimiento |

Ejemplos reales del proyecto:

```
feat(convocatorias): agregar factory de tipos de convocatoria
fix(solicitudes): corregir validacion de documentos faltantes
test(evaluaciones): pruebas del criterio de merito academico
docs(arquitectura): justificar el monolito modular
```

### Paso 4 — Subir tu rama

La primera vez que subes una rama:

```bash
git push -u origin feature/US-012-crear-solicitud
```

Las siguientes veces, en esa misma rama, basta con:

```bash
git push
```

### Paso 5 — Abrir el Pull Request

Entra al repositorio en GitHub. Aparece un botón amarillo **"Compare & pull request"**.

- **Base:** `develop` ← **Compare:** tu rama *(revisa que la base NO sea `main`)*
- Título: `US-012 — Crear solicitud`
- La plantilla se llena sola: complétala y marca el checklist de la Definition of Done
- A la derecha, en **Reviewers**, asigna a un compañero

Luego pídele en el chat del equipo que te lo revise.

### Paso 6 — Después de la aprobación

Cuando tu compañero aprueba, presionas **"Merge pull request"** y luego **"Delete branch"**.

De vuelta en tu máquina:

```bash
git checkout develop
```

```bash
git pull
```

Y ya puedes empezar la siguiente historia desde el Paso 1.

---

## Cómo revisar el PR de un compañero

Tu revisión también se evalúa. Un PR aprobado en treinta segundos sin un solo comentario se nota
en el historial.

1. Entra al PR → pestaña **"Files changed"**
2. Lee el código de verdad. Al pasar el cursor por una línea aparece un **+** azul para comentar.
3. Deja **al menos un comentario sustantivo**. Una pregunta honesta cuenta:
   - *"¿Qué pasa si el estudiante no tiene documentos cargados?"*
   - *"Esto podría reutilizar el validador de `shared/`, ¿lo consideraste?"*
   - *"Falta la prueba del caso en que la convocatoria ya cerró."*
4. Verifica que se respete la regla de capas: **nada dentro de `domain/` importa NestJS, Prisma
   ni HTTP.**
5. Botón **"Review changes"** → `Approve` si está bien, o `Request changes` si falta algo.

> No apruebes por compromiso. Si algo no te convence, pregúntalo. Para eso existe el paso.

---

## Reglas del equipo

1. **Nadie hace `push` directo a `main` ni a `develop`.** GitHub lo bloquea, pero además es un
   acuerdo del Anexo 3.
2. **Una rama por historia de usuario.** No mezcles dos historias en la misma rama.
3. **Nunca subas el archivo `.env`.** Está en `.gitignore`, pero no lo fuerces.
4. **Antes de abrir un PR**, corre las pruebas y el linter en tu máquina:

```bash
npm test
```

```bash
npm run lint
```

---

## Problemas comunes

### "Me equivoqué de rama y ya hice commits"

Estás en `develop` y no debías. Crea la rama correcta desde aquí:

```bash
git checkout -b feature/US-012-crear-solicitud
```

Los commits se van contigo. Luego regresa `develop` a como estaba:

```bash
git checkout develop
```

```bash
git reset --hard origin/develop
```

> ⚠️ `reset --hard` **borra** cambios sin guardar de la rama en la que estás. Asegúrate primero
> de que tus commits ya quedaron en la otra rama (`git log` para comprobarlo).

### "Tengo conflictos al hacer merge"

Actualiza tu rama con lo último de `develop`:

```bash
git checkout develop
```

```bash
git pull
```

```bash
git checkout tu-rama
```

```bash
git merge develop
```

Git marca los conflictos en los archivos así:

```
<<<<<<< HEAD
tu version
=======
la version de develop
>>>>>>> develop
```

Abre cada archivo en VS Code —te ofrece botones para aceptar una versión u otra—, borra las
marcas `<<<<`, `====` y `>>>>`, deja el código como debe quedar, y luego:

```bash
git add .
```

```bash
git commit -m "merge: integrar develop en la rama de trabajo"
```

> Si el conflicto es grande o no lo entiendes, **para y pregunta en el chat del equipo**. Un
> merge mal resuelto borra el trabajo de otro compañero.

### "Quiero cambiar el mensaje del último commit"

Solo si **todavía no lo subiste**:

```bash
git commit --amend -m "nuevo mensaje corregido"
```

### "¿En qué rama estoy?"

```bash
git branch
```

La que tiene el asterisco `*` es la actual.

### "¿Qué he cambiado?"

```bash
git status
```

```bash
git diff
```

### "Quiero ver el historial"

```bash
git log --graph --oneline --all
```

Se sale con la tecla `q`.

---

## Chuleta rápida

| Quiero... | Comando |
|---|---|
| Ver en qué estado estoy | `git status` |
| Ver en qué rama estoy | `git branch` |
| Cambiar de rama | `git checkout nombre-rama` |
| Crear una rama nueva | `git checkout -b feature/US-XXX-descripcion` |
| Traer lo último del servidor | `git pull` |
| Guardar mis cambios | `git add .` y luego `git commit -m "mensaje"` |
| Subir mi rama | `git push` |
| Ver el historial | `git log --graph --oneline --all` |
| Ver qué cambié | `git diff` |
