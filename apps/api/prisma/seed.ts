/**
 * Datos de prueba para desarrollo local (`npm run db:seed`).
 *
 * Requiere PostgreSQL levantado (`docker compose up -d`) y las migraciones aplicadas
 * (`npm run db:migrate`). No se ejecuta en las pruebas unitarias: esas usan el
 * repositorio en memoria y no tocan la base de datos.
 */
import { resolve } from 'node:path';

import { EstadoConvocatoria, PrismaClient, TipoBeca } from '@prisma/client';
import { config } from 'dotenv';

// Este script se ejecuta con `ts-node` desde `apps/api`, fuera del contenedor de
// NestJS, así que no pasa por el `ConfigModule`. Cargamos el `.env` de la raíz a
// mano, apuntando al mismo archivo que declara `app.module.ts`.
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

function enDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

async function main(): Promise<void> {
  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-001' },
    update: {},
    create: {
      codigo: 'CONV-2026-001',
      titulo: 'Beca Universitaria Nacional 2026',
      descripcion:
        'Apoyo económico para estudiantes de licenciatura en universidades del sistema nacional.',
      tipo: TipoBeca.UNIVERSITARIA,
      estado: EstadoConvocatoria.PUBLICADA,
      cupos: 500,
      fechaApertura: enDias(-10),
      fechaCierre: enDias(45),
    },
  });

  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-002' },
    update: {},
    create: {
      codigo: 'CONV-2026-002',
      titulo: 'Beca de Posgrado en Ciencia y Tecnología 2026',
      descripcion: 'Maestrías y doctorados en áreas prioritarias para el desarrollo nacional.',
      tipo: TipoBeca.POSGRADO,
      estado: EstadoConvocatoria.PUBLICADA,
      cupos: 40,
      fechaApertura: enDias(-3),
      fechaCierre: enDias(60),
    },
  });

  // En BORRADOR: sirve para comprobar que el listado público NO la devuelve.
  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-003' },
    update: {},
    create: {
      codigo: 'CONV-2026-003',
      titulo: 'Beca de Nivel Medio 2026 (en preparación)',
      descripcion: 'Aún no publicada. No debe aparecer en el listado público.',
      tipo: TipoBeca.NIVEL_MEDIO,
      estado: EstadoConvocatoria.BORRADOR,
      cupos: 1200,
      fechaApertura: enDias(20),
      fechaCierre: enDias(80),
    },
  });

  console.log('Datos de prueba cargados.');
}

main()
  .catch((error) => {
    console.error('Error al cargar los datos de prueba:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
