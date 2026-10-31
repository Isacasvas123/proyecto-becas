# Plataforma Nacional para la Gestión Integral de Becas

Proyecto final de Análisis de Sistemas II (0910-037), Universidad Mariano Gálvez, Facultad de
Ingeniería en Sistemas de Información y Ciencias de la Computación, 8º ciclo.

**Catedrático:** Ing. Mario Fuentes
**Equipo ControlExe:** Isaac Castillo (Scrum Master) · Iván García · Fernando Herrera · Stuard Estrada
**Entrega final:** 31 de octubre de 2026
**Staging:** https://becas-web-staging.onrender.com

Plataforma web para que el Ministerio de Educación administre las becas de principio a fin:
convocatorias, solicitudes, documentos, evaluación por comités, resolución y consulta pública.

## Tecnologías

| | |
|---|---|
| Backend | NestJS · Node 22 · TypeScript |
| Frontend | React · Vite · TypeScript |
| Base de datos | PostgreSQL 16 · Prisma |
| Pruebas | Jest · Supertest |
| CI | GitHub Actions |
| Despliegue | Docker · Render |

Monolito modular en capas con puertos y adaptadores. Detalle en
[`docs/05-arquitectura.md`](docs/05-arquitectura.md).

## Ejecutar en local

Requisitos: Node 22+, Docker Desktop y Git.

```bash
git clone https://github.com/Isacasvas123/proyecto-becas.git
cd proyecto-becas
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

| Dirección | Contenido |
|---|---|
| http://localhost:5173 | Aplicación web |
| http://localhost:3000 | API (`/health` para comprobarla) |
| http://localhost:8080 | Adminer |

Usuario de desarrollo: `admin` / `EC321` (definido en `.env.example`, solo para uso local).

Si algo falla al instalar, ver [`docs/13-guia-instalacion.md`](docs/13-guia-instalacion.md).

## Pruebas

```bash
npm test            # unitarias
npm run test:cov    # con cobertura
npm run test:e2e    # integración
npm run lint
```

## Flujo de trabajo

Nadie hace push a `main` ni a `develop`; todo entra por Pull Request.

```
main
 └ develop
    └ feature/US-XXX-descripcion
    └ fix/descripcion
    └ docs/descripcion
```

Commits en formato [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(convocatorias): agregar factory de tipos de convocatoria
fix(solicitudes): corregir validación de documentos faltantes
```

Cada Pull Request lleva el ID de la historia en el título, la Definition of Done completa, la
aprobación de otro integrante y el CI en verde. La guía completa está en
[`docs/11-guia-git.md`](docs/11-guia-git.md).

## Documentación

| Documento | Archivo |
|---|---|
| Acta de Constitución del Equipo | [`01-acta-constitucion.md`](docs/01-acta-constitucion.md) |
| Política de Trabajo en Grupo | [`02-politica-equipo.md`](docs/02-politica-equipo.md) |
| Visión del Producto | [`03-vision-producto.md`](docs/03-vision-producto.md) |
| Product Backlog, NFR y DoD | [`04-product-backlog.md`](docs/04-product-backlog.md) |
| Arquitectura | [`05-arquitectura.md`](docs/05-arquitectura.md) |
| Patrones de diseño | [`06-patrones.md`](docs/06-patrones.md) |
| Casos de uso, componentes y clases | [`diagramas/`](docs/diagramas/) |
| Matriz de trazabilidad | [`15-matriz-trazabilidad.md`](docs/15-matriz-trazabilidad.md) |
| Plan de Calidad | [`18-plan-calidad.md`](docs/18-plan-calidad.md) |
| Plan de Pruebas | [`19-plan-pruebas.md`](docs/19-plan-pruebas.md) |
| Manual Técnico | [`20-manual-tecnico.md`](docs/20-manual-tecnico.md) |
| Manual de Usuario | [`21-manual-usuario.md`](docs/21-manual-usuario.md) |
| Análisis de impacto de los requerimientos del 17 de octubre | [`23-analisis-impacto-requerimientos-po.md`](docs/23-analisis-impacto-requerimientos-po.md) |
| Minutas de sprint | [`minutas/`](docs/minutas/) |

## Entornos

| Entorno | Rama | Uso |
|---|---|---|
| Local | `feature/*` | Desarrollo |
| Staging | `develop` | Pruebas y revisión del catedrático |
| Producción | `main` | Presentación final |
