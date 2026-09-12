-- US-002, criterio 3: tras 5 intentos fallidos consecutivos, la cuenta se bloquea 15 minutos.
-- La regla vive en la entidad Usuario del dominio; estas columnas solo guardan el estado.
--
-- Las dos columnas son compatibles con los datos existentes: el contador arranca en 0 y el
-- bloqueo en NULL, que es exactamente el estado de una cuenta que nunca fallo un intento.

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bloqueado_hasta" TIMESTAMP(3),
ADD COLUMN     "intentos_fallidos" INTEGER NOT NULL DEFAULT 0;
