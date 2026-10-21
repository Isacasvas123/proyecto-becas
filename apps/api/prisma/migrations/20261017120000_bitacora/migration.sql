-- CreateTable
CREATE TABLE "bitacora" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_usuario" TEXT,
    "actor_rol" "RolUsuario",
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidad_id" TEXT,
    "resultado" INTEGER NOT NULL,
    "origen" TEXT,
    "ocurrido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bitacora_ocurrido_en_idx" ON "bitacora"("ocurrido_en");

-- CreateIndex
CREATE INDEX "bitacora_actor_id_ocurrido_en_idx" ON "bitacora"("actor_id", "ocurrido_en");

-- CreateIndex
CREATE INDEX "bitacora_entidad_entidad_id_idx" ON "bitacora"("entidad", "entidad_id");

