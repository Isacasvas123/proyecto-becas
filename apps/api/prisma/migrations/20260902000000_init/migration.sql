-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoBeca" AS ENUM ('NIVEL_MEDIO', 'UNIVERSITARIA', 'POSGRADO');

-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');

-- CreateTable
CREATE TABLE "convocatorias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoBeca" NOT NULL,
    "estado" "EstadoConvocatoria" NOT NULL DEFAULT 'BORRADOR',
    "cupos" INTEGER NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3) NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convocatorias_codigo_key" ON "convocatorias"("codigo");

-- CreateIndex
CREATE INDEX "convocatorias_estado_fecha_cierre_idx" ON "convocatorias"("estado", "fecha_cierre");

