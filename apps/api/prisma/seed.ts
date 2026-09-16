/**
 * Datos de prueba para desarrollo local (`npm run db:seed`).
 *
 * Requiere PostgreSQL levantado (`docker compose up -d`) y las migraciones aplicadas
 * (`npm run db:migrate`). No se ejecuta en las pruebas unitarias: esas usan el
 * repositorio en memoria y no tocan la base de datos.
 */
import { resolve } from 'node:path';

import { EstadoConvocatoria, PrismaClient, RolUsuario, TipoBeca } from '@prisma/client';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

import { FABRICAS_CONVOCATORIA } from '../src/modules/convocatorias/domain/factories/convocatoria.factory';

// Este script se ejecuta con `ts-node` desde `apps/api`, fuera del contenedor de
// NestJS, así que no pasa por el `ConfigModule`. Cargamos el `.env` de la raíz a
// mano, apuntando al mismo archivo que declara `app.module.ts`.
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

/**
 * Requisitos y documentos por defecto de un tipo, leídos de su FÁBRICA (US-006).
 *
 * El seed no tiene su propia lista: si la tuviera, el día que cambien los documentos de
 * posgrado los datos de prueba dejarían de parecerse a lo que crea la aplicación. Se usa en
 * `update` además de en `create`, para que una base sembrada antes de US-006 —cuando las
 * convocatorias no tenían requisitos— quede al día al volver a ejecutar el seed.
 */
function catalogoDe(tipo: TipoBeca) {
  const fabrica = FABRICAS_CONVOCATORIA[tipo];
  return {
    requisitos: [...fabrica.requisitosPorDefecto()],
    documentosExigidos: [...fabrica.documentosPorDefecto()],
  };
}

function enDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

async function main(): Promise<void> {
  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-001' },
    update: catalogoDe(TipoBeca.UNIVERSITARIA),
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
      ...catalogoDe(TipoBeca.UNIVERSITARIA),
    },
  });

  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-002' },
    update: catalogoDe(TipoBeca.POSGRADO),
    create: {
      codigo: 'CONV-2026-002',
      titulo: 'Beca de Posgrado en Ciencia y Tecnología 2026',
      descripcion: 'Maestrías y doctorados en áreas prioritarias para el desarrollo nacional.',
      tipo: TipoBeca.POSGRADO,
      estado: EstadoConvocatoria.PUBLICADA,
      cupos: 40,
      fechaApertura: enDias(-3),
      fechaCierre: enDias(60),
      ...catalogoDe(TipoBeca.POSGRADO),
    },
  });

  // En BORRADOR: sirve para comprobar que el listado público NO la devuelve.
  await prisma.convocatoria.upsert({
    where: { codigo: 'CONV-2026-003' },
    update: catalogoDe(TipoBeca.NIVEL_MEDIO),
    create: {
      codigo: 'CONV-2026-003',
      titulo: 'Beca de Nivel Medio 2026 (en preparación)',
      descripcion: 'Aún no publicada. No debe aparecer en el listado público.',
      tipo: TipoBeca.NIVEL_MEDIO,
      estado: EstadoConvocatoria.BORRADOR,
      cupos: 1200,
      fechaApertura: enDias(20),
      fechaCierre: enDias(80),
      ...catalogoDe(TipoBeca.NIVEL_MEDIO),
    },
  });

  await sembrarAdministrador();
  await sembrarEvaluador();

  console.log('Datos de prueba cargados.');
}

/**
 * Usuario administrador inicial para desarrollo local (US-002).
 *
 * DE DÓNDE SALEN LAS CREDENCIALES
 *   De las variables `ADMIN_USUARIO`, `ADMIN_PASSWORD` y `ADMIN_CORREO` del `.env`.
 *   Nunca están escritas en este archivo: si lo estuvieran, quedarían para siempre en el
 *   historial de Git y cualquiera que clonara el repositorio las tendría.
 *
 * LA CONTRASEÑA SE GUARDA CON HASH BCRYPT
 *   Cumple el NFR de seguridad de docs/04-product-backlog.md §5. El valor en claro solo
 *   existe en el `.env` local, que está en `.gitignore`.
 *
 * ⚠️  ESTE SEED ES SOLO PARA DESARROLLO. No debe ejecutarse contra Staging ni producción:
 *     ahí el administrador se crea con credenciales propias definidas en el servidor.
 */
async function sembrarAdministrador(): Promise<void> {
  const nombreUsuario = (process.env.ADMIN_USUARIO ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const correo = process.env.ADMIN_CORREO ?? '';

  if (nombreUsuario === '' || password === '' || correo === '') {
    console.warn(
      'Se omite el administrador: faltan ADMIN_USUARIO, ADMIN_PASSWORD o ADMIN_CORREO en el .env',
    );
    return;
  }

  const rondas = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const hashPassword = await hash(password, Number.isInteger(rondas) ? rondas : 10);

  await prisma.usuario.upsert({
    where: { nombreUsuario },
    // `update` también refresca el hash: si alguien cambia ADMIN_PASSWORD en su `.env`
    // y vuelve a sembrar, la contraseña nueva queda aplicada.
    update: { hashPassword, correo, rol: RolUsuario.ADMINISTRADOR, activo: true },
    create: {
      nombreUsuario,
      correo,
      hashPassword,
      rol: RolUsuario.ADMINISTRADOR,
      activo: true,
    },
  });

  console.log(`Administrador listo: ${nombreUsuario} (rol ADMINISTRADOR)`);
}

/**
 * Un evaluador de prueba (EPIC-04), con el mismo cuidado que el administrador: credenciales del
 * `.env` (`EVALUADOR_USUARIO`, `EVALUADOR_PASSWORD`, `EVALUADOR_CORREO`), hash bcrypt, y solo en
 * desarrollo. En Staging los evaluadores los crea un administrador desde la gestión.
 */
async function sembrarEvaluador(): Promise<void> {
  const nombreUsuario = (process.env.EVALUADOR_USUARIO ?? '').trim().toLowerCase();
  const password = process.env.EVALUADOR_PASSWORD ?? '';
  const correo = process.env.EVALUADOR_CORREO ?? '';

  if (nombreUsuario === '' || password === '' || correo === '') {
    console.warn('Se omite el evaluador de prueba: faltan EVALUADOR_* en el .env');
    return;
  }

  const rondas = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const hashPassword = await hash(password, Number.isInteger(rondas) ? rondas : 10);

  await prisma.usuario.upsert({
    where: { nombreUsuario },
    update: { hashPassword, correo, rol: RolUsuario.EVALUADOR, activo: true },
    create: {
      nombreUsuario,
      correo,
      hashPassword,
      nombreCompleto: 'Evaluadora de Prueba',
      rol: RolUsuario.EVALUADOR,
      activo: true,
    },
  });

  console.log(`Evaluador listo: ${nombreUsuario} (rol EVALUADOR)`);
}

main()
  .catch((error) => {
    console.error('Error al cargar los datos de prueba:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
