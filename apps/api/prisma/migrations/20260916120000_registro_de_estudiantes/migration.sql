-- US-001: identidad de la persona para el registro de estudiantes.
-- Columnas opcionales: las cuentas existentes (el administrador) quedan con NULL, y
-- PostgreSQL admite varios NULL en un indice unico.

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cui" TEXT,
ADD COLUMN     "nombre_completo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cui_key" ON "usuarios"("cui");

