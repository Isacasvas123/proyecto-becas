# Entorno de Staging — cómo se levanta y cómo se verifica

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Responsable** | Ivan (arquitectura y DevOps) |
| **Fecha** | 11 de septiembre de 2026 · **Versión** 1.0 |

> **Por qué este documento existe.** El punto 8 de nuestra Definition of Done exige que la
> funcionalidad esté **desplegada en Staging y verificada**. Mientras eso no exista, ninguna
> historia puede darse por terminada por más que funcione en las máquinas del equipo. Ha sido el
> bloqueo declarado del Sprint 1.

> ⚠️ **Estado al 11 de septiembre de 2026: la configuración está escrita, el entorno NO está
> levantado.** Los archivos de este documento definen el despliegue completo, pero crear la cuenta
> y conectar el repositorio requiere credenciales y eso lo tiene que hacer una persona. Los pasos
> de la §2 son exactamente lo que falta.

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

3. **Crear el Blueprint.** En el panel: **New → Blueprint**, elegir `proyecto-becas`, rama
   `develop`. Render lee `render.yaml` y muestra los tres recursos que va a crear. Confirmar.

4. **Esperar el primer despliegue.** Tarda entre 5 y 10 minutos. La base de datos se crea primero;
   la API arranca después y aplica las migraciones sola.

5. **Copiar la URL de la API.** Queda algo como `https://becas-api-staging.onrender.com`.
   Comprobar a mano, una sola vez, que `<URL>/ready` responde `200`.

6. **Crear el administrador de Staging.** El seed no corre, así que hay que crear la cuenta a
   mano, con una contraseña **distinta** a la de desarrollo. Desde **Render → becas-staging-db →
   Connect → PSQL Command**, y con un hash bcrypt generado aparte. Nunca reutilizar `EC321`.

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
