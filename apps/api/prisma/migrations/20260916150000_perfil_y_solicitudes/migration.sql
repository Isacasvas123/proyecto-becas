-- CreateEnum
CREATE TYPE "NivelAcademico" AS ENUM ('NIVEL_MEDIO', 'UNIVERSITARIO', 'POSGRADO');

-- CreateEnum
CREATE TYPE "Departamento" AS ENUM ('ALTA_VERAPAZ', 'BAJA_VERAPAZ', 'CHIMALTENANGO', 'CHIQUIMULA', 'EL_PROGRESO', 'ESCUINTLA', 'GUATEMALA', 'HUEHUETENANGO', 'IZABAL', 'JALAPA', 'JUTIAPA', 'PETEN', 'QUETZALTENANGO', 'QUICHE', 'RETALHULEU', 'SACATEPEQUEZ', 'SAN_MARCOS', 'SANTA_ROSA', 'SOLOLA', 'SUCHITEPEQUEZ', 'TOTONICAPAN', 'ZACAPA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('BORRADOR', 'ENVIADA', 'EN_EVALUACION', 'APROBADA', 'RECHAZADA', 'ADJUDICADA');

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "centro_educativo" TEXT,
    "nivel" "NivelAcademico",
    "promedio" DECIMAL(5,2),
    "ingreso_familiar_mensual" DECIMAL(12,2),
    "dependientes" INTEGER,
    "departamento" "Departamento",
    "municipio" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "convocatoria_id" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'BORRADOR',
    "documentos_exigidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enviada_en" TIMESTAMP(3),
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_solicitud" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "tipo_contenido" TEXT NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "cargado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estado_solicitud" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "desde" "EstadoSolicitud",
    "hacia" "EstadoSolicitud" NOT NULL,
    "autor_id" TEXT NOT NULL,
    "motivo" TEXT,
    "ocurrido_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historial_estado_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_usuario_id_key" ON "estudiantes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numero_key" ON "solicitudes"("numero");

-- CreateIndex
CREATE INDEX "solicitudes_estudiante_id_convocatoria_id_idx" ON "solicitudes"("estudiante_id", "convocatoria_id");

-- CreateIndex
CREATE INDEX "solicitudes_convocatoria_id_estado_idx" ON "solicitudes"("convocatoria_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_solicitud_solicitud_id_tipo_key" ON "documentos_solicitud"("solicitud_id", "tipo");

-- CreateIndex
CREATE INDEX "historial_estado_solicitud_solicitud_id_ocurrido_en_idx" ON "historial_estado_solicitud"("solicitud_id", "ocurrido_en");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_convocatoria_id_fkey" FOREIGN KEY ("convocatoria_id") REFERENCES "convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_solicitud" ADD CONSTRAINT "documentos_solicitud_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_solicitud" ADD CONSTRAINT "historial_estado_solicitud_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

