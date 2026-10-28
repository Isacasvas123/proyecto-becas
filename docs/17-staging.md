# Entorno de Staging — cómo se levanta y cómo se verifica

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Responsable** | Ivan (arquitectura y DevOps) |
| **Fecha** | 11 de septiembre de 2026 · **Versión** 1.3 (10 Oct: entorno levantado) |

> **Por qué este documento existe.** El punto 8 de nuestra Definition of Done exige que la
> funcionalidad esté **desplegada en Staging y verificada**. Mientras eso no exista, ninguna
> historia puede darse por terminada por más que funcione en las máquinas del equipo. Ha sido el
> bloqueo declarado del Sprint 1.

> ✅ **Estado al 4 de octubre de 2026: el entorno está levantado y verificado.**
>
> | | |
> |---|---|
> | Aplicación | `https://becas-web-staging.onrender.com` |
> | API | `https://becas-api-staging.onrender.com` |
> | Blueprint | `becas-staging`, enganchado a `develop`: cada merge se despliega solo |
> | Verificación | Workflow *Verificar Staging*, corrida 37219963097, los cinco pasos en verde |
> | Administrador | `admin.staging`, creado a mano con `scripts/crear-admin-staging.mjs` |
>
> Levantarlo destapó **dos fallos que ningún entorno local mostraba**: Render rechaza la clave
> `plan` en sitios estáticos (PR #21) y la carpeta de documentos no existía en la imagen, así que
> subir un archivo devolvía 500 (PR #22). Los dos están corregidos y documentados abajo.
>
> Los pasos de la §2 se conservan porque son la receta para volver a levantarlo: la base gratuita
> **caduca el 2 de noviembre de 2026** y habrá que recrearla.

### Qué sí está comprobado (12 de septiembre de 2026)

La imagen de Docker **se construye y arranca**, verificado contra el PostgreSQL local:

```bash
docker build -f apps/api/Dockerfile -t becas-api-staging:test .
```

| Comprobación                                      | Resultado                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `docker build`                                     | ✅ Construye. Imagen de **1.13 GB**                               |
| Migraciones al arrancar                           | ✅ `prisma migrate deploy` corre solo: _"No pending migrations"_   |
| Conexión a PostgreSQL                             | ✅ _"Conexión con PostgreSQL establecida"_                         |
| Rutas mapeadas                                    | ✅ Las cuatro: `/health`, `/ready`, `/convocatorias`, `/auth/login` |
| `GET /health`                                     | ✅ 200 · `{"status":"ok"}`                                         |
| `GET /ready`                                      | ✅ 200 · `{"baseDatos":"arriba"}`                                  |
| `GET /convocatorias`                              | ✅ 200 · devuelve el listado                                       |
| `POST /auth/login` con credenciales falsas         | ✅ 401 · _"Usuario o contraseña incorrectos"_, sin decir cuál falló |
| **`/ready` con PostgreSQL detenido**               | ✅ **503** · `{"baseDatos":"abajo"}` — y `/health` sigue en 200     |

> **La última fila es la que justifica todo el defecto que corregimos en S1-12.** Antes
> `/health` respondía `ok` con la base caída y por tanto no servía para verificar nada. Ahora, con
> PostgreSQL detenido a propósito, el contenedor real distingue las dos preguntas: el proceso vive
> (`/health` 200) pero no está listo para atender (`/ready` 503). Eso es exactamente lo que Render
> necesita para no enrutar tráfico a una instancia que no puede responder, y es lo que comprueba
> el workflow de verificación.

> **Sobre el tamaño: 1.13 GB es grande** para una API de Node, y es la consecuencia directa de
> incluir todas las dependencias en la imagen final (el motivo está comentado en el Dockerfile: el
> CLI de `prisma` es devDependency y hace falta tanto en el `postinstall` como al arrancar). Se
> acepta para Staging. Si llegara a molestar, la salida limpia es una tercera etapa que instale
> solo producción con `--ignore-scripts` y copie el cliente de Prisma ya generado desde la etapa de
> build, en vez de mover `prisma` a `dependencies`, que sería declarar una mentira sobre para qué
> sirve ese paquete.

---

## 1. Qué se decidió y por qué

| Decisión | Alternativas descartadas | Motivo |
|---|---|---|
| **Render**, plan gratuito | Fly.io, Railway, un VPS | Fly.io y Railway piden tarjeta. Un VPS da más control pero exige administrar el servidor, y eso no es lo que evalúa el curso. Render lee la configuración del repositorio, que es lo que queríamos. |
| **Infraestructura como código** (`render.yaml`) | Configurar a mano en el panel | Si se configura a mano, la única documentación es la memoria de quien lo hizo. Así queda en el repositorio, revisable en un Pull Request. |
| **Docker para la API** | Build nativo de Node en Render | La misma imagen corre igual en cualquier máquina del equipo y en el servidor. Elimina el "en mi máquina sí funciona". |
| **Migraciones al arrancar** | Migrar a mano tras cada despliegue | Un paso manual es un paso que alguien olvida. `prisma migrate deploy` solo aplica migraciones existentes: nunca genera ni borra nada. |
| **El seed NO se ejecuta** | Sembrar el admin automáticamente | El seed crea el administrador con las credenciales de `.env.example`. En un entorno accesible por red eso sería regalar una cuenta de administrador conocida. |

### Archivos que componen el despliegue

| Archivo | Qué hace |
|---|---|
| `render.yaml` | Define los tres recursos: base de datos, API y frontend, con sus variables de entorno |
| `apps/api/Dockerfile` | Construye la imagen de la API en dos etapas y la ejecuta como usuario sin privilegios |
| `.github/workflows/verificar-staging.yml` | Comprueba automáticamente que lo desplegado responde, y guarda la evidencia |

> **No hubo que tocar una línea de código de la aplicación.** La URL de la API, el origen de CORS,
> el secreto del JWT y la cadena de conexión ya se leían de variables de entorno
> (`apps/api/src/main.ts`, `apps/web/src/api/cliente.ts`). Esa disciplina, que en su momento
> pareció ceremonia, es la razón por la que el despliegue fue configuración y no reescritura.

---

## 2. Lo que falta hacer — paso a paso

Requiere una cuenta y por eso no está hecho. Son unos 20 minutos.

1. **Crear la cuenta en Render.** Entrar a [render.com](https://render.com) y registrarse con la
   cuenta de GitHub. El plan gratuito no pide tarjeta.

2. **Autorizar el repositorio.** Render pedirá acceso; conceder solo a `proyecto-becas`, no a
   todos los repositorios de la cuenta.

> ⚠️ **Si Render rechaza el Blueprint** con `services[1].plan no such plan free for service
> type web`: es el sitio estatico. Render no admite `plan` en sitios estaticos, son gratuitos
> siempre. Corregido el 3 de octubre de 2026.

3. **Crear el Blueprint.** En el panel: **New → Blueprint**, elegir `proyecto-becas`, rama
   `develop`. Render lee `render.yaml` y muestra los tres recursos que va a crear.

   **Render va a pedir dos valores a mano.** Escribirlos **con `https://`**:

   | Variable | Servicio | Valor |
   |---|---|---|
   | `CORS_ORIGEN` | `becas-api-staging` | `https://becas-web-staging.onrender.com` |
   | `VITE_API_URL` | `becas-web-staging` | `https://becas-api-staging.onrender.com` |

   ⚠️ Sin `https://`, o con una barra `/` al final, el despliegue sale en verde pero **el
   navegador rechaza las peticiones por CORS** y la aplicación no carga datos. Confirmar.

4. **Esperar el primer despliegue.** Tarda entre 5 y 10 minutos. La base de datos se crea primero;
   la API arranca después y aplica las migraciones sola. La imagen ya está verificada localmente
   (ver el cuadro del inicio), así que si falla aquí el problema será de configuración de Render o
   de variables de entorno, no del Dockerfile.

5. **Comprobar las URLs reales.** Si Render asignó un nombre distinto al esperado (agrega un
   sufijo cuando el nombre ya está tomado), **corregir `CORS_ORIGEN` y `VITE_API_URL`** en
   *Environment* de cada servicio y volver a desplegar el frontend. Después abrir
   `<URL de la API>/ready` y verificar que responde `200`.

6. **Crear el administrador de Staging.** El seed no corre, así que la cuenta se crea con
   `node scripts/crear-admin-staging.mjs`. El script pide la contraseña sin mostrarla, calcula su
   hash bcrypt y la inserta. Nunca reutilizar la de desarrollo.

   Para que escriba en la base, hay que darle la **External Database URL** de Render
   (**becas-staging-db → Connect → External**). Dos formas, la segunda más cómoda en PowerShell
   porque no hay que pegar a ciegas en un campo oculto:

   ```powershell
   $env:STAGING_DB_URL = "<la URL de Render>"
   node scripts/crear-admin-staging.mjs
   Remove-Item Env:STAGING_DB_URL
   ```

   Si prefiere no darle acceso a la base, deje esa pregunta vacía: imprime el `INSERT` para
   ejecutarlo donde quiera. Esa URL lleva la contraseña de PostgreSQL dentro; no se comparte por
   chat ni se pega en el repositorio.

7. **Registrar la URL en GitHub.** En el repositorio: **Settings → Secrets and variables →
   Actions → Variables → New repository variable**, con nombre `STAGING_API_URL` y la URL del
   paso 5 como valor. Sin esto, el workflow de verificación avisa que falta configurarse en vez
   de fallar a ciegas.

8. **Lanzar la verificación.** En **Actions → Verificar Staging → Run workflow**. Si todo está
   bien, el resumen del workflow queda como evidencia para la Sprint Review.

---

## 3. Qué comprueba la verificación, y por qué esas cuatro cosas

| Comprobación | Qué demuestra de verdad |
|---|---|
| `GET /health` → 200 | El proceso está vivo y atiende peticiones |
| `GET /ready` → 200 | **PostgreSQL responde.** Esta es la que importa |
| `GET /convocatorias` → 200 | US-008 funciona en el entorno real, no solo en local |
| `POST /auth/login` con credenciales falsas → 401 genérico | Criterio de US-002: el mensaje no revela si falló el usuario o la contraseña |

> **La segunda comprobación existe gracias a un defecto propio.** Hasta el Sprint 1, `/health`
> respondía `ok` aunque la base de datos estuviera caída, porque se hizo así para que la API
> arrancara sin Docker. Es decir: no servía para verificar nada. Al separarlo en `/health`
> (¿vive el proceso?) y `/ready` (¿responde la base?) pasó a ser una comprobación con sentido.
> Ese fue el defecto 1 de los tres del esqueleto, y se corrigió en S1-12.

### Por qué no se verifica el guard de US-003 aquí

En el Sprint 1 **todas las rutas que existen son legítimamente públicas**: el login, el listado
público de convocatorias y los dos diagnósticos. No hay ninguna ruta con sesión que consultar.

El guard global está instalado y es *seguro por defecto* —toda ruta nueva exige sesión salvo que
se marque `@Publico()`— y está cubierto por las pruebas de integración. Pero su verificación en
Staging no puede existir hasta que exista la primera ruta protegida real, en el Sprint 3.

Decirlo aquí es preferible a inventar una comprobación que no comprueba nada.

---

### Un fallo que costó encontrar: los documentos no se podían subir

La primera vez que se subió un documento en Staging, la API devolvió **500**. El adaptador de
almacenamiento guarda en `./uploads`, relativa al directorio de trabajo del proceso, y esa carpeta
no existía en la imagen. El contenedor corre como el usuario `node`, que **no puede crear carpetas
en `/app`** porque pertenece a root: `mkdir` fallaba y el fallo salía como error interno.

Se corrigió creando la carpeta en el `Dockerfile` con dueño `node`, y declarando
`ALMACENAMIENTO_TIPO` y `ALMACENAMIENTO_RUTA_LOCAL` en `render.yaml` en vez de depender de los
valores por defecto del código.

Es un buen ejemplo de algo que ningún entorno local detecta: en desarrollo la carpeta se crea sin
problema porque el proceso corre con el usuario de la máquina.

## 4. Limitaciones conocidas del plan gratuito

| Limitación | Consecuencia práctica |
|---|---|
| El servicio se suspende tras 15 min sin tráfico | El primer acceso tarda ~50 s. **Abrir Staging unos minutos antes de una demostración ante el Product Owner.** No es un fallo del despliegue. |
| La base de datos gratuita caduca a los 90 días | Hay que recrearla. Anotado como riesgo: cae cerca del 10 de diciembre, después de la entrega del 31 de octubre. |
| Sin copias de seguridad automáticas | Staging es desechable por definición: si se pierde, se vuelve a desplegar. No debe contener nada que importe. |

---

## 5. Qué NO es este entorno

Staging **no es producción**. No tiene dominio propio, ni certificado propio, ni copias de
seguridad, ni monitoreo, ni plan de recuperación. Es un entorno para que el Product Owner pueda
ver y aceptar el trabajo sin instalar nada, y para que el equipo verifique en un servidor real
antes de dar una historia por terminada.

Si el proyecto siguiera después del curso, lo que faltaría para producción es otra conversación:
plan de pago sin suspensión, copias de seguridad con restauración probada, monitoreo con alertas,
y separación real de secretos.
