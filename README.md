# Plataforma Nacional para la Gestión Integral de Becas

Proyecto final de **Análisis de Sistemas II (0910-037)** — Universidad Mariano Gálvez,
Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación, 8º Ciclo.

**Product Owner:** Ing. Mario Fuentes
**Equipo:** Isaac (Scrum Master) · Ivan · Fernando · Stuard
**Entrega final:** 31 de octubre de 2026

---

## Qué es

Plataforma web para que el Ministerio de Educación administre el ciclo de vida completo de las
becas: convocatorias, solicitudes, documentación, evaluación por comités, resolución y consulta
pública del estado.

## Stack

| | |
|---|---|
| Backend | NestJS · Node 22 · TypeScript |
| Frontend | React · Vite · TypeScript |
| Base de datos | PostgreSQL 16 · Prisma |
| Pruebas | Jest · Supertest |
| CI | GitHub Actions |

**Arquitectura:** monolito modular en capas con puertos y adaptadores.
Ver [`docs/05-arquitectura.md`](docs/05-arquitectura.md).

---

## Cómo levantarlo en local

**Requisitos:** Node 22+, Docker Desktop, Git.

```bash
git clone <url-del-repo>
cd plataforma-becas
cp .env.example .env
docker compose up -d          # levanta PostgreSQL en el puerto 5432
npm install
npm run db:migrate            # aplica las migraciones de Prisma
npm run db:seed               # datos de prueba
npm run dev                   # API en :3000 · web en :5173
```

Verificar que funciona:

```bash
curl http://localhost:3000/health
```

## Pruebas

```bash
npm test                      # pruebas unitarias
npm run test:cov              # con reporte de cobertura
npm run test:e2e              # pruebas de integración
npm run lint                  # análisis estático
```

---

## Cómo se trabaja aquí

**Nadie hace push a `main` ni a `develop`.** Todo entra por Pull Request.

```
main      ← versiones estables y desplegables
 └ develop ← integración continua
    └ feature/US-XXX-descripcion-corta
    └ fix/descripcion-corta
    └ docs/descripcion-corta
```

**Flujo para una historia de usuario:**

```bash
git checkout develop && git pull
git checkout -b feature/US-012-crear-solicitud
# ... trabajar, con commits pequeños y descriptivos ...
git push -u origin feature/US-012-crear-solicitud
# abrir Pull Request hacia develop en GitHub
```

**Commits** en formato [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(convocatorias): agregar factory de tipos de convocatoria
fix(solicitudes): corregir validación de documentos faltantes
test(evaluaciones): pruebas del criterio de mérito académico
docs(arquitectura): justificar el monolito modular
```

**Todo Pull Request requiere:**
- Título con el ID de la historia de usuario
- Descripción de qué resuelve
- Checklist de la Definition of Done completo
- **Aprobación de un integrante distinto al autor**
- CI en verde

---

## Ritmo del equipo

Sprints semanales de jueves a miércoles.

| Día | Quiénes |
|---|---|
| **Jueves** | Los 4 — Sprint Review, Retrospective y Planning |
| Viernes | Isaac + Ivan |
| Sábado | Fernando + Stuard |
| Domingo | Libre / buffer |
| Lunes | Isaac + Fernando |
| Martes | Ivan + Stuard |
| **Miércoles** | Los 4 — cierre asincrónico e integración |

---

## Documentación

| Documento | Anexo |
|---|---|
| [Guion de reunión de arranque](docs/00-guion-reunion-sprint-1.md) | — |
| [Acta de Constitución del Equipo](docs/01-acta-constitucion.md) | 1 |
| [Política de Trabajo en Grupo](docs/02-politica-equipo.md) | 3 |
| [Visión del Producto](docs/03-vision-producto.md) | 4 §2-3 |
| [Product Backlog, NFRs y DoD](docs/04-product-backlog.md) | 4 §4-6 |
| [Documento de Arquitectura](docs/05-arquitectura.md) | 5 |
| [Justificación de Patrones de Diseño](docs/06-patrones.md) | — |
| [Plan de Aseguramiento de Calidad](docs/07-qap.md) | 6 |
| [Plan de Pruebas](docs/08-plan-pruebas.md) | 7 |
| [Manual Técnico](docs/09-manual-tecnico.md) | — |
| [Manual de Usuario](docs/10-manual-usuario.md) | — |
| [Minutas de sprints](docs/minutas/) | 2 |

> La documentación vive en el repositorio, no en Drive: el enunciado exige control de versiones
> **del código y de la documentación**, así que cada cambio de documento también pasa por Pull
> Request.

---

## Entornos

| Entorno | Rama | Para qué |
|---|---|---|
| Local | `feature/*` | Desarrollo y pruebas unitarias |
| Staging | `develop` | Pruebas de integración y aceptación del Product Owner |
| Producción | `main` | Sprint Reviews y presentación final |
