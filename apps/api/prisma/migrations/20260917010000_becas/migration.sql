-- CreateTable
CREATE TABLE "becas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "otorgada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "becas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "becas_codigo_key" ON "becas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "becas_solicitud_id_key" ON "becas"("solicitud_id");

-- AddForeignKey
ALTER TABLE "becas" ADD CONSTRAINT "becas_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

