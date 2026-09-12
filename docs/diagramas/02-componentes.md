# Diagrama de Componentes
### Anexo 5 §3.2 — Plataforma Nacional para la Gestión Integral de Becas

| | |
|---|---|
| **Responsable** | Fernando (diagramas) · revisado por el equipo |
| **Fecha** | 5 de septiembre de 2026 · **Versión** 1.1 (11 sep: verificado contra el código) |

> Este diagrama debe reflejar la arquitectura elegida —monolito modular en capas con puertos y
> adaptadores— y mostrar **las interfaces**, no solo las cajas. Las flechas indican dependencia:
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
    NOTI["✉️ Servicio de<br/>notificaciones"]
    EXT["🏛️ Entidades externas<br/><i>RENAP, MinEduc</i>"]

    NAV -->|HTTPS| WEB
    WEB -->|"HTTP/JSON"| PRES
    PRES --> APLI
    APLI --> DOMI
    INFR -.->|implementa los puertos| DOMI
    INFR --> BD
    INFR --> ALM
    INFR --> NOTI
    INFR -.->|Sprint 6| EXT

    style DOMI fill:#fef3e2,stroke:#b45309,stroke-width:3px
    style DESPLIEGUE fill:#f0f7fc,stroke:#12609c,stroke-width:2px
    style API fill:#ffffff,stroke:#0a3558
    style WEB fill:#e6f1fa,stroke:#1d4ed8
```

**La única flecha que hay que entender** es la punteada de `infrastructure` hacia `domain`.

En una arquitectura tradicional el negocio dependería de la base de datos: la flecha iría al
revés. Aquí está **invertida**. El dominio declara qué necesita y la infraestructura obedece.

Por eso `domain` aparece resaltado: **todas las flechas apuntan hacia él y él no apunta a nadie.**

---

## 2. Módulos de negocio

El monolito está dividido por dentro. Cada módulo repite las cuatro capas.

```mermaid
flowchart LR
    subgraph MODULOS["modules/"]
        direction TB
        M1["<b>usuarios</b> ✅<br/>autenticación y roles"]
        M2["<b>convocatorias</b> ✅<br/>programas de beca"]
        M3["<b>estudiantes</b> ⬜<br/>perfil del aspirante"]
        M4["<b>solicitudes</b> ⬜<br/>expediente y su ciclo"]
        M5["<b>evaluaciones</b> ⬜<br/>comités y dictámenes"]
        M6["<b>reportes</b> ⬜<br/>estadísticas"]
        M7["<b>salud</b> ✅<br/>liveness y readiness"]
    end

    subgraph COMPARTIDO["shared/"]
        direction TB
        S1["<b>exceptions</b><br/>errores de dominio<br/>y filtro global"]
        S2["<b>persistence</b><br/>PrismaService"]
    end

    M4 -->|capa de aplicación| M2
    M4 -->|capa de aplicación| M3
    M5 -->|capa de aplicación| M4
    M6 -->|capa de aplicación| M4

    M1 --> COMPARTIDO
    M2 --> COMPARTIDO
    M4 --> COMPARTIDO

    style M1 fill:#e4f4ec,stroke:#0f7a52
    style M2 fill:#e4f4ec,stroke:#0f7a52
    style MODULOS fill:#f0f7fc,stroke:#12609c
    style COMPARTIDO fill:#fef3e2,stroke:#b45309
```

✅ construido · ⬜ pendiente

**Regla de comunicación entre módulos.** Un módulo solo llama a **la capa de aplicación** de
otro. Nunca importa sus entidades de dominio ni su repositorio.

Es la mitigación del riesgo que documentamos como *"monolito distribuido interno"*: si los
módulos se importaran libremente entre sí, tendríamos las desventajas de los microservicios sin
ninguna de sus ventajas. Se verifica en cada code review.

---

## 3. Interfaces expuestas

### Del sistema hacia afuera

| Interfaz | Consumidor | Estado |
|---|---|---|
| `POST /auth/login` | WebApp | 🟢 Implementada |
| `GET /convocatorias` | WebApp | 🟢 Implementada |
| `GET /health` | Monitoreo · CI | 🟢 Implementada — *liveness*: responde si el proceso vive |
| `GET /ready` | Monitoreo · CI · Staging | 🟢 Implementada — *readiness*: 503 si PostgreSQL no responde |
| `POST /solicitudes` | WebApp | 🔴 Sprint 4 |
| `GET /consulta-publica/{numero}` | WebApp, sin autenticación | 🔴 Sprint 6 |

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
| `AlmacenamientoDocumentosPort` | `AlmacenamientoLocalAdapter`<br/>`AlmacenamientoNubeAdapter` | solicitudes | 🔴 Sprint 4 |
| `NotificacionPort` | `NotificacionConsolaAdapter`<br/>`NotificacionCorreoAdapter` | solicitudes | 🔴 Sprint 5 |

> **Que cada puerto tenga dos adaptadores no es casualidad.** Uno real y uno de prueba. Es lo que
> permite que las 72 pruebas unitarias corran en segundos sin levantar PostgreSQL, y es la demostración
> práctica del principio de sustitución de Liskov.

---

## 4. Cómo se enlazan puerto y adaptador

El enlace ocurre en **un solo archivo por módulo**, la raíz de composición:

```ts
// modules/usuarios/usuarios.module.ts
providers: [
  AutenticarUsuarioService,
  { provide: USUARIO_REPOSITORIO, useClass: UsuarioPrismaRepositorio },
  { provide: HASHER_PASSWORD,     useClass: BcryptHasherAdapter },
  { provide: GENERADOR_TOKEN,     useClass: JwtGeneradorTokenAdapter },
]
```

Migrar de bcrypt a argon2, o de JWT a sesiones en servidor, es **cambiar una línea**. Ni la
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
        S1["API<br/>Render"]
        S2["Web<br/>Vercel"]
        S3[("PostgreSQL<br/>Neon")]
        S2 --- S1 --- S3
    end

    subgraph PROD["Producción — main"]
        P1["API + Web"]
        P2[("PostgreSQL")]
        P1 --- P2
    end

    LOCAL -->|Pull Request| STAGING
    STAGING -->|release| PROD

    style LOCAL fill:#e6f1fa,stroke:#1d4ed8
    style STAGING fill:#fef3e2,stroke:#b45309
    style PROD fill:#e4f4ec,stroke:#0f7a52
```

> ⚠️ **Staging no está desplegado todavía.** Es el bloqueo más grande del proyecto: la Definition
> of Done exige que cada historia esté desplegada y verificada por el Product Owner, así que
> mientras no exista, **ninguna historia puede darse por terminada**. Responsable: Ivan.
