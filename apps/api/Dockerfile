# Imagen de la API para Staging.
#
# Build en dos etapas a propósito: la imagen final no lleva el código TypeScript, ni las
# dependencias de desarrollo, ni el compilador. Solo el JavaScript compilado y lo que hace
# falta para ejecutarlo. Eso reduce el tamaño y la superficie de ataque.
#
# El contexto de build es la RAÍZ del repositorio, no esta carpeta, porque es un monorepo con
# npm workspaces: `npm ci` necesita ver el package-lock.json de la raíz para instalar de forma
# reproducible. Se construye así:
#
#   docker build -f apps/api/Dockerfile -t becas-api .

# ──────────────────────────────────────────────────────────────────────────────
# Etapa 1 — compilación
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Primero solo los manifiestos. Docker cachea esta capa, así que un cambio en el código
# fuente no vuelve a descargar todas las dependencias.
#
# Se copia también el schema.prisma antes de instalar porque el `postinstall` de la raíz
# ejecuta `prisma generate`, y sin el schema ese paso falla.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/api/prisma ./apps/api/prisma

RUN npm ci

# Ahora sí, el código.
COPY . .

RUN npm run build --workspace apps/api

# ──────────────────────────────────────────────────────────────────────────────
# Etapa 2 — ejecución
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# `node` es un usuario sin privilegios que la imagen oficial ya trae. Correr como root
# dentro del contenedor no aporta nada y es un riesgo gratuito.
#
# POR QUÉ SE COPIAN TODAS LAS DEPENDENCIAS Y NO SOLO LAS DE PRODUCCIÓN
#   Lo natural sería un `npm ci --omit=dev` para adelgazar la imagen, y es lo que decía la
#   primera versión de este archivo. No funciona en este proyecto, por dos razones:
#
#   1. El `postinstall` de la raíz ejecuta `prisma generate`, y el CLI de `prisma` es una
#      devDependency. Con `--omit=dev` se desinstala y el postinstall falla: el build se cae.
#   2. El arranque ejecuta `prisma migrate deploy`, que también necesita ese CLI. Sin él,
#      `npx` intentaría descargarlo en cada arranque: más lento y dependiente de la red.
#
#   El costo es una imagen más grande. Se acepta: es un entorno de Staging, y la alternativa
#   —mover `prisma` a dependencies solo para poder podar— sería declarar una mentira sobre
#   para qué sirve ese paquete.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json

USER node

EXPOSE 3000

# Las migraciones se aplican al arrancar, no en el build: en el build todavía no hay una
# base de datos a la que conectarse. `migrate deploy` solo aplica migraciones ya existentes
# y nunca genera ni borra nada, que es lo que se quiere fuera de desarrollo.
#
# Deliberadamente NO se ejecuta `db:seed` aquí. El seed crea el administrador con las
# credenciales de `.env.example`, y meterlas en un entorno accesible por red sería regalar
# una cuenta de administrador conocida.
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
