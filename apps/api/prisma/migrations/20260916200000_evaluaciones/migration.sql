-- CreateEnum
CREATE TYPE "Recomendacion" AS ENUM ('FAVORABLE', 'DESFAVORABLE');

-- CreateTable
CREATE TABLE "comites" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "convocatoria_id" TEXT NOT NULL,
    "creado_por_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comite_evaluadores" (
    "comite_id" TEXT NOT NULL,
    "evaluador_id" TEXT NOT NULL,
    "agregado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comite_evaluadores_pkey" PRIMARY KEY ("comite_id","evaluador_id")
);

-- CreateTable
CREATE TABLE "asignaciones_evaluacion" (
    "id" TEXT NOT NULL,
    "comite_id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "evaluador_id" TEXT NOT NULL,
    "asignada_por_id" TEXT NOT NULL,
    "asignada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictamenes" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "evaluador_id" TEXT NOT NULL,
    "criterio" TEXT NOT NULL,
    "puntaje" DECIMAL(5,2) NOT NULL,
    "desglose" JSONB NOT NULL,
    "recomendacion" "Recomendacion" NOT NULL,
    "observacion" TEXT NOT NULL,
    "emitido_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictamenes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comites_convocatoria_id_key" ON "comites"("convocatoria_id");

-- CreateIndex
CREATE INDEX "asignaciones_evaluacion_evaluador_id_idx" ON "asignaciones_evaluacion"("evaluador_id");

-- CreateIndex
CREATE INDEX "asignaciones_evaluacion_comite_id_idx" ON "asignaciones_evaluacion"("comite_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_evaluacion_solicitud_id_evaluador_id_key" ON "asignaciones_evaluacion"("solicitud_id", "evaluador_id");

-- CreateIndex
CREATE INDEX "dictamenes_evaluador_id_idx" ON "dictamenes"("evaluador_id");

-- CreateIndex
CREATE UNIQUE INDEX "dictamenes_solicitud_id_evaluador_id_key" ON "dictamenes"("solicitud_id", "evaluador_id");

-- AddForeignKey
ALTER TABLE "comites" ADD CONSTRAINT "comites_convocatoria_id_fkey" FOREIGN KEY ("convocatoria_id") REFERENCES "convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comites" ADD CONSTRAINT "comites_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comite_evaluadores" ADD CONSTRAINT "comite_evaluadores_comite_id_fkey" FOREIGN KEY ("comite_id") REFERENCES "comites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comite_evaluadores" ADD CONSTRAINT "comite_evaluadores_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_evaluacion" ADD CONSTRAINT "asignaciones_evaluacion_comite_id_fkey" FOREIGN KEY ("comite_id") REFERENCES "comites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_evaluacion" ADD CONSTRAINT "asignaciones_evaluacion_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_evaluacion" ADD CONSTRAINT "asignaciones_evaluacion_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_evaluacion" ADD CONSTRAINT "asignaciones_evaluacion_asignada_por_id_fkey" FOREIGN KEY ("asignada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictamenes" ADD CONSTRAINT "dictamenes_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictamenes" ADD CONSTRAINT "dictamenes_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

