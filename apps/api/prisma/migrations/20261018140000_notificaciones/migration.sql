-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "desde" "EstadoSolicitud",
    "hacia" "EstadoSolicitud" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "motivo" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_estudiante_id_leida_creada_en_idx" ON "notificaciones"("estudiante_id", "leida", "creada_en");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

