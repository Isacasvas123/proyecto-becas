-- AlterEnum
ALTER TYPE "EstadoSolicitud" ADD VALUE 'APROBACION_PENDIENTE';

-- AlterTable
ALTER TABLE "convocatorias" ADD COLUMN     "monto_beca" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN     "monto_beca" INTEGER NOT NULL DEFAULT 0;

