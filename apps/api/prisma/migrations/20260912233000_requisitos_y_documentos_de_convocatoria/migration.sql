-- US-006: requisitos y documentos exigidos por convocatoria.
-- Generada con `prisma migrate diff` a partir del schema.prisma, sin base de datos local.
-- Las convocatorias existentes quedan con listas vacias: siguen visibles si estaban
-- publicadas, y un borrador sin requisitos simplemente no podra publicarse (US-007).

-- CreateEnum
CREATE TYPE "Requisito" AS ENUM ('NACIONALIDAD_GUATEMALTECA', 'ESTUDIANTE_NIVEL_MEDIO_INSCRITO', 'ESTUDIANTE_UNIVERSITARIO_INSCRITO', 'TITULO_UNIVERSITARIO', 'PROMEDIO_MINIMO_70', 'PROMEDIO_MINIMO_75', 'PROMEDIO_MINIMO_80', 'INGRESO_FAMILIAR_LIMITADO', 'CARTA_RECOMENDACION');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DPI', 'CERTIFICADO_NACIMIENTO', 'CONSTANCIA_INSCRIPCION', 'CERTIFICADO_NOTAS', 'TITULO_UNIVERSITARIO', 'CONSTANCIA_INGRESOS', 'CARTA_RECOMENDACION');

-- AlterTable
ALTER TABLE "convocatorias" ADD COLUMN     "documentos_exigidos" "TipoDocumento"[] DEFAULT ARRAY[]::"TipoDocumento"[],
ADD COLUMN     "requisitos" "Requisito"[] DEFAULT ARRAY[]::"Requisito"[];

