-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_hash_token_key" ON "tokens_recuperacion"("hash_token");

-- CreateIndex
CREATE INDEX "tokens_recuperacion_usuario_id_idx" ON "tokens_recuperacion"("usuario_id");

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

