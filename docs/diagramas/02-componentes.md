# Diagrama de Componentes
### Anexo 5 §3.2 — Plataforma Nacional para la Gestión Integral de Becas

| | |
|---|---|
| **Responsable** | Fernando (diagramas) · revisado por el equipo |
| **Fecha** | 5 de septiembre de 2026 · **Versión** 1.3 (28 oct: los nueve módulos, los puertos actuales y el despliegue real) |

> Este diagrama debe reflejar la arquitectura elegida —monolito modular en capas con puertos y
> adaptadores— y mostrar las interfaces, no solo las cajas. Las flechas indican dependencia:
> quien apunta, depende.

---

## 1. Vista general del sistema

```mermaid
flowchart TB
    NAV["🌐 Navegador<br/><i>Chrome · Firefox · Edge</i>"]

    subgraph DESPLIEGUE["Artefacto desplegable único"]
        direction TB

        WEB["<b>WebApp</b><br/>React · Vite · TypeScript<br/><i>páginas, componentes, enrutador</i>"]

        subgraph API["API REST — NestJS"]
            direction TB
            PRES["<b>presentation</b><br/>controladores · DTOs · validación"]
            APLI["<b>application</b><br/>casos de uso · orquestación"]
            DOMI["<b>domain</b><br/>entidades · objetos de valor<br/><b>puertos (interfaces)</b>"]
            INFR["<b>infrastructure</b><br/>repositorios Prisma · adaptadores"]
        end
    end

    BD[("🗄️ PostgreSQL 16")]
    ALM["📁 Almacenamiento<br/>de documentos"]
    NOTI["✉️ Correo<br/><i>consola o SMTP</i>"]
    EXT["🏛️ Entidades externas<br/><i>RENAP, MinEduc</i>"]

    NAV -->|HTTPS| WEB
    WEB -->|"HTTP/JSON"| PRES
    PRES --> APLI
    APLI --> DOMI
    INFR -.->|implementa los puertos| DOMI
    INFR --> BD
    INFR --> ALM
    INFR --> NOTI
    INFR -.->|integración futura| EXT

    style DOMI fill:#fef3e2,stroke:#b45309,stroke-width:3px
    style DESPLIEGUE fill:#f0f7fc,stroke:#12609c,stroke-width:2px
    style API fill:#ffffff,stroke:#0a3558
    style WEB fill:#e6f1fa,stroke:#1d4ed8
```

La flecha que concentra la decisión de diseño es la punteada, de `infrastructure` hacia `domain`.

En una arquitectura tradicional la lógica de negocio dependería de la base de datos y la flecha
iría en sentido contrario. Aquí está invertida: el dominio declara lo que necesita mediante
interfaces y la infraestructura las implementa.

`domain` aparece resaltado porque todas las dependencias apuntan hacia él y ninguna sale de él.

---

## 2. Módulos de negocio

El monolito está dividido por dentro. Cada módulo repite las cuatro capas.

```mermaid
flowchart LR
    subgraph MODULOS["modules/"]
        direction TB
        M1["<b>usuarios</b><br/>cuentas, acceso y recuperación"]
        M2["<b>convocatorias</b><br/>programas de beca"]
        M3["<b>estudiantes</b><br/>perfil del aspirante"]
        M4["<b>solicitudes</b><br/>expediente, ciclo y avisos"]
        M5["<b>evaluaciones</b><br/>comités y dictámenes"]
        M6["<b>resoluciones</b><br/>aprobar, adjudicar y consulta pública"]
        M7["<b>reportes</b><br/>estadísticas y exportación"]
        M8["<b>bitacora</b><br/>auditoría"]
        M9["<b>salud</b><br/>liveness y readiness"]
    end

    subgraph COMPARTIDO["shared/"]
        direction TB
        S1["<b>exceptions</b><br/>errores de dominio<br/>y filtro global"]
        S2["<b>persistence</b><br/>PrismaService"]
        S3["<b>reglas</b><br/>umbral de la segunda aprobación"]
    end

    M4 --> M2
    M4 --> M3
    M5 --> M4
    M5 --> M2
    M5 --> M3
    M5 --> M1
    M6 --> M4
    M6 --> M5
    M6 --> M2
    M6 --> M1
    M7 --> M4
    M7 --> M3
    M7 --> M2

    M1 --> COMPARTIDO
    M2 --> COMPARTIDO
    M4 --> COMPARTIDO
    M8 --> COMPARTIDO
    M9 --> COMPARTIDO

    style M6 fill:#fef3e2,stroke:#b45309
    style MODULOS fill:#f0f7fc,stroke:#12609c
    style COMPARTIDO fill:#fef3e2,stroke:#b45309
```

Cada flecha entre módulos pasa por la capa de aplicación. `resoluciones` está resaltado porque es el módulo más alto: depende de cuatro y nadie depende de él.
`bitacora` no depende de ningún otro módulo: la escribe un middleware global y los demás ni lo
mencionan.

**Regla de comunicación entre módulos.** Un módulo solo llama a la capa de aplicación de
otro. Nunca importa sus entidades de dominio ni su repositorio.

Es la mitigación del riesgo que documentamos como *"monolito distribuido interno"*: si los
módulos se importaran libremente entre sí, tendríamos las desventajas de los microservicios sin
ninguna de sus ventajas. Se verifica en cada code review.

---

## 3. Interfaces expuestas

### Del sistema hacia afuera

| Interfaz | Consumidor | Estado |
|---|---|---|
| `/auth/*`: login, registro y recuperación de contraseña | WebApp | 🟢 |
| `/convocatorias/*` | WebApp | 🟢 |
| `/estudiantes/*` | WebApp | 🟢 |
| `/solicitudes/*` y `/notificaciones/*` | WebApp | 🟢 |
| `/evaluadores`, `/comites/*` y `/evaluaciones/*` | WebApp | 🟢 |
| `/resoluciones/*` | WebApp | 🟢 |
| `POST /consulta-publica` | WebApp, sin autenticación | 🟢 |
| `/reportes/*` | WebApp | 🟢 |
| `/bitacora/*` | WebApp | 🟢 |
| `GET /health` | Monitoreo · CI | 🟢 *Liveness*: responde si el proceso vive |
| `GET /ready` | Monitoreo · CI · Staging | 🟢 *Readiness*: 503 si PostgreSQL no responde |

El detalle de cada ruta, con su rol y sus códigos de error, está en `20-manual-tecnico.md §4.1`.

### Puertos que el dominio declara

Esta es la tabla que demuestra la inversión de dependencias. Cada puerto es una interfaz escrita
en `domain/`; cada adaptador la implementa en `infrastructure/`.

| Puerto (domain) | Adaptadores (infrastructure) | Módulo | Estado |
|---|---|---|---|
| `UsuarioRepositorio` | `UsuarioPrismaRepositorio`<br/>`UsuarioEnMemoriaRepositorio` | usuarios | 🟢 |
| `HasherPassword` | `BcryptHasherAdapter` | usuarios | 🟢 |
| `GeneradorToken` | `JwtGeneradorTokenAdapter` | usuarios | 🟢 |
| `VerificadorToken` | `JwtVerificadorTokenAdapter` | usuarios | 🟢 — lo consume el guard global (US-003) |
| `ConvocatoriaRepositorio` | `ConvocatoriaPrismaRepositorio`<br/>`ConvocatoriaEnMemoriaRepositorio` | convocatorias | 🟢 |
| `EnviadorCorreo` | `CorreoConsolaAdapter`<br/>`CorreoSmtpAdapter` | usuarios | 🟢 El SMTP no está verificado contra un servidor real |
| `TokenRecuperacionRepositorio` | `TokenRecuperacionPrismaRepositorio`<br/>`TokenRecuperacionEnMemoriaRepositorio` | usuarios | 🟢 |
| `AlmacenamientoDocumentos` | `AlmacenamientoLocalAdapter`<br/>`AlmacenamientoMemoriaAdapter` | solicitudes | 🟢 El de nube no existe |
| `NotificadorSolicitudes` | `NotificadorConsolaAdapter` | solicitudes | 🟢 |
| `NotificacionRepositorio` | `NotificacionPrismaRepositorio`<br/>`NotificacionEnMemoriaRepositorio` | solicitudes | 🟢 La bandeja de avisos (US-034) |
| `BitacoraRepositorio` | `BitacoraPrismaRepositorio`<br/>`BitacoraEnMemoriaRepositorio` | bitacora | 🟢 Solo escribe y lee |
| `ExportadorReporte` | `CsvExportador`<br/>`PdfExportador` | reportes | 🟢 |

> Los puertos de persistencia tienen un adaptador real y uno en memoria para las pruebas. Es lo
> que permite que las 504 pruebas unitarias corran en segundos sin levantar PostgreSQL, y es la
> demostración práctica del principio de sustitución de Liskov.
>
> Los puertos que cruzan módulos (`ConsultaSolicitudes`, `ConsultaConvocatorias`,
> `ConsultaPerfiles` y sus equivalentes en `evaluaciones`, `resoluciones` y `reportes`) no se
> listan aquí; están en el Manual Técnico, sección 3.3.

---

## 4. Cómo se enlazan puerto y adaptador

El enlace ocurre en un solo archivo por módulo, la raíz de composición:

```ts
// modules/usuarios/usuarios.module.ts
providers: [
  AutenticarUsuarioService,
  { provide: USUARIO_REPOSITORIO, useClass: UsuarioPrismaRepositorio },
  { provide: HASHER_PASSWORD,     useClass: BcryptHasherAdapter },
  { provide: GENERADOR_TOKEN,     useClass: JwtGeneradorTokenAdapter },
]
```

Migrar de bcrypt a argon2, o de JWT a sesiones en servidor, es cambiar una línea. Ni la
entidad, ni el caso de uso, ni el controlador se enteran.

---

## 5. Verificación automática de la regla de capas

La regla no depende de que el revisor se acuerde. Está codificada en `eslint.config.mjs`:

```
domain/        → prohibido importar @nestjs/*, @prisma/client, express
application/   → prohibido importar infrastructure/
```

Si alguien la viola, ESLint falla y el CI bloquea el Pull Request. Se comprobó provocando la
violación a propósito.

---

## 6. Entornos de despliegue

```mermaid
flowchart LR
    subgraph LOCAL["Local — feature/*"]
        L1["API + Web<br/>npm run dev"]
        L2[("PostgreSQL<br/>Docker Compose")]
        L1 --- L2
    end

    subgraph STAGING["Staging — develop"]
        S1["API<br/>Render, en Docker"]
        S2["Web<br/>Render, sitio estático"]
        S3[("PostgreSQL<br/>Render")]
        S2 --- S1 --- S3
    end

    MAIN["main<br/>rama de entrega"]

    LOCAL -->|Pull Request| STAGING
    STAGING -->|Pull Request aprobado| MAIN

    style LOCAL fill:#e6f1fa,stroke:#1d4ed8
    style STAGING fill:#fef3e2,stroke:#b45309
    style MAIN fill:#e4f4ec,stroke:#0f7a52
```

Staging se despliega desde `develop` y está definido como código en `render.yaml`. El workflow
*Verificar Staging* comprueba `/health`, `/ready`, el listado público y que el login rechace
credenciales inválidas. `main` es la rama de entrega y no tiene un despliegue propio.
