# Guía de instalación — de cero a la app corriendo

Para Ivan, Fernando y Stuard. Sigue los pasos **en orden**. Tarda entre 30 y 60 minutos, casi
todo esperando descargas.

> Hazlo **antes de tu primer turno**, no el día que te toque trabajar. Si algo falla, escribe en
> el canal `#bloqueos` con la captura del error.

---

## Paso 1 — Aceptar la invitación al repositorio

Isaac te envía una invitación a GitHub. Te llega **al correo** con el que registraste tu cuenta.

1. Abre el correo y pulsa **Accept invitation**
2. Comprueba que puedes abrir: https://github.com/Isacasvas123/proyecto-becas

Si no ves el repositorio, no sigas: dile a Isaac que te reinvite. Todo lo demás depende de esto.

---

## Paso 2 — Instalar los programas

Los cuatro son gratis. Instálalos en este orden.

### 2.1 Node.js 22
https://nodejs.org → botón **LTS** · Siguiente, siguiente, siguiente.

### 2.2 Git
https://git-scm.com/download/win → todo por defecto.

### 2.3 Visual Studio Code
https://code.visualstudio.com/download → botón azul de Windows.

### 2.4 Docker Desktop
https://www.docker.com/products/docker-desktop/

Al instalarlo elige **"Per-user installation (Recommended)"**, la que ya viene marcada.

> ⚠️ **En Windows 11 Home te va a fallar con "Virtualization support not detected".**
> No es tu computadora: falta WSL. Se arregla así:
>
> 1. Menú Inicio → escribe `terminal` → **clic derecho → Ejecutar como administrador**
> 2. Pega esto y Enter:
>
>    ```
>    wsl --install
>    ```
>
> 3. **Reinicia la computadora.** No te saltes el reinicio.
> 4. Abre Docker Desktop y espera a que abajo a la izquierda diga **"Engine running"** en verde.

### Comprobar que quedó todo

Abre una terminal nueva (Menú Inicio → `terminal`) y pega estos tres comandos, uno por uno:

```
node --version
```

```
git --version
```

```
docker --version
```

Si los tres responden con un número de versión, vas bien. Si alguno dice *"no se reconoce"*,
cierra la terminal, abre una nueva y vuelve a probar. Si sigue fallando, reinstala ese programa.

---

### ⚠️ Si al usar npm te sale "la ejecución de scripts está deshabilitada"

Es lo más probable que te pase en Windows. El error se ve así:

```
npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1 porque
la ejecución de scripts está deshabilitada en este sistema.
```

No es que npm esté mal instalado: PowerShell bloquea los scripts por seguridad, y `npm` lo es.

**Arreglo rápido** — añade `.cmd` a cada comando de npm:

```
npm.cmd install
```

**Arreglo permanente** — para no escribir `.cmd` nunca más:

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Confirma con `S` y Enter. Luego **cierra y vuelve a abrir la terminal**.

> `RemoteSigned` permite ejecutar scripts creados en tu propia máquina, pero sigue bloqueando
> los descargados de internet que no estén firmados. Es la configuración habitual para
> desarrollar en Windows. `-Scope CurrentUser` limita el cambio a tu usuario, no a todo el
> equipo. Si algún día quieres revertirlo: `Set-ExecutionPolicy -Scope CurrentUser Restricted`.

---

## Paso 3 — Decirle a Git quién eres

**Este paso importa para tu nota.** Si el correo no coincide con el de tu cuenta de GitHub, tus
commits no se asocian a tu perfil y parecerá que no trabajaste. El catedrático puede ver la
gráfica de contribuciones por persona.

```
git config --global user.name "Tu Nombre Completo"
```

```
git config --global user.email "el-mismo-correo-de-tu-cuenta-github@ejemplo.com"
```

---

## Paso 4 — Descargar el proyecto

Abre VS Code → menú `Terminal` → `New Terminal`. Pega los comandos uno por uno.

Colócate primero en tus Documentos:

```
cd $env:USERPROFILE\Documents
```

Descarga el proyecto:

```
git clone https://github.com/Isacasvas123/proyecto-becas.git
```

Entra a la carpeta:

```
cd proyecto-becas
```

> Si te pide usuario y contraseña, se abrirá una ventana del navegador para iniciar sesión en
> GitHub. Autoriza y listo.

Ahora abre esa carpeta en VS Code: menú `File` → `Open Folder` → selecciona `proyecto-becas`.

---

## Paso 5 — Cambiarte a la rama con el código

⚠️ **No te saltes este paso.** La rama por defecto (`develop`) todavía **no tiene el código**: la
carpeta `apps/` te va a aparecer casi vacía. El código vive en una rama aparte hasta que se
aprueben los Pull Requests.

```
git checkout feature/US-002-inicio-sesion
```

Comprueba que ahora sí está el código:

```
dir apps\api\src\modules
```

Debes ver las carpetas `convocatorias`, `salud` y `usuarios`.

> Cuando el equipo mergee los Pull Requests a `develop`, este paso dejará de hacer falta.

---

## Paso 6 — Configurar el entorno

Copia el archivo de configuración:

```
copy .env.example .env
```

Ese `.env` guarda contraseñas y **nunca se sube al repositorio**. Cada quien tiene el suyo.

---

## Paso 7 — Levantar la base de datos

Asegúrate de que **Docker Desktop esté abierto** y diga "Engine running".

```
docker compose up -d
```

La primera vez descarga PostgreSQL, tarda unos minutos. Cuando termine, verifica:

```
docker compose ps
```

Debes ver `becas_db` con estado **healthy**.

---

## Paso 8 — Instalar las dependencias del proyecto

```
npm install
```

Descarga unos 700 paquetes. Tarda entre 2 y 5 minutos. Es normal que salgan avisos amarillos
(`warn`); solo preocúpate si sale `error`.

---

## Paso 9 — Preparar la base de datos

Crear las tablas:

```
npm run db:migrate
```

Cargar datos de prueba:

```
npm run db:seed
```

Debe terminar diciendo *"Administrador listo: admin"* y *"Datos de prueba cargados"*.

---

## Paso 10 — Arrancar la aplicación

```
npm run dev
```

**Este comando se queda corriendo.** No se colgó: así debe ser. Déjalo abierto mientras trabajas.
Para detenerlo, `Ctrl` + `C` en esa terminal.

Abre en el navegador: **http://localhost:5173**

Inicia sesión con:

| Usuario | Contraseña |
|---|---|
| `admin` | `EC321` |

Si ves el listado de convocatorias con sus colores, **ya tienes todo funcionando**. 🎉

---

## Direcciones útiles

| Dirección | Qué es |
|---|---|
| http://localhost:5173 | La aplicación |
| http://localhost:3000/convocatorias | La API en crudo (JSON) |
| http://localhost:3000/health | Estado de la API |
| http://localhost:8080 | Adminer, para ver la base de datos |

**Para entrar a Adminer:** sistema `PostgreSQL` · servidor `postgres` · usuario `becas` ·
contraseña `becas_dev` · base de datos `becas`.

---

## Cada vez que te sientes a trabajar

Solo dos comandos, en este orden. Con Docker Desktop abierto:

```
docker compose up -d
```

```
npm run dev
```

Y antes de empezar a programar, trae lo último de tus compañeros:

```
git checkout develop
```

```
git pull
```

El flujo completo de ramas y Pull Requests está en
[`docs/11-guia-git.md`](11-guia-git.md). **Léelo antes de tu primer turno.**

---

## Comprobación final

Marca cada punto. Si alguno falla, escribe en `#bloqueos` **antes** de tu turno:

- [ ] Acepté la invitación y puedo abrir el repositorio en GitHub
- [ ] `node --version`, `git --version` y `docker --version` responden
- [ ] Docker Desktop dice "Engine running" en verde
- [ ] Configuré `user.name` y `user.email` con el correo de mi cuenta de GitHub
- [ ] Cloné el proyecto y me cambié a la rama con el código
- [ ] `docker compose ps` muestra `becas_db` como healthy
- [ ] `npm run dev` arranca sin errores
- [ ] Entro a http://localhost:5173 con `admin` / `EC321`
- [ ] Leí la guía de Git

---

## Problemas frecuentes

**"npm : No se puede cargar el archivo ... npm.ps1 porque la ejecución de scripts está deshabilitada"**
PowerShell bloquea scripts por seguridad. Usa `npm.cmd` en lugar de `npm`, o corre una sola vez
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y reabre la terminal. Explicado arriba, al
final del Paso 2.

**"docker: command not found" o "no se reconoce"**
Cierra la terminal y abre una nueva. Si sigue, no terminó de instalarse: reinicia la computadora.

**"Cannot connect to the Docker daemon" / "error during connect"**
Docker Desktop no está abierto. Ábrelo y espera a que diga "Engine running".

**`npm run db:seed` falla con "Environment variable not found: DATABASE_URL"**
Te falta el `.env`. Corre `copy .env.example .env`.

**`npm run dev` dice "port 3000 already in use"**
Ya lo tienes corriendo en otra terminal. Ciérrala, o reinicia la computadora.

**La carpeta `apps` aparece vacía**
Estás en la rama equivocada. Corre `git checkout feature/US-002-inicio-sesion`.

**La web carga pero dice que no puede contactar la API**
Te falta `npm run dev`, o la base de datos no está levantada. Revisa `docker compose ps`.

**"Permission denied" o pide contraseña al hacer git push**
No aceptaste la invitación al repositorio, o Git no está autenticado. Dile a Isaac.

---

*¿Algo no funciona y no está en esta lista? Escríbelo en `#bloqueos` con una captura del error
completo. No pierdas dos horas peleando solo: el Anexo 3 nos compromete a avisar los problemas de
forma proactiva.*
