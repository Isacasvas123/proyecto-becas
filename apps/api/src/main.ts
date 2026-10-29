/**
 * Punto de arranque de la API.
 *
 * Aquí solo va configuración transversal del proceso: puerto, CORS, validación global y
 * manejo centralizado de excepciones. Ninguna regla de negocio.
 */
import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { DominioExceptionFilter } from './shared/exceptions/dominio-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En Staging la API está detrás del proxy de Render: sin esto, la dirección de todas las
  // peticiones sería la del proxy y el límite de la consulta pública (US-025) bloquearía a todos a
  // la vez. Se confía en UN salto, el del proxy; no en lo que diga cualquier cliente.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Validación de entrada en la frontera del sistema. `whitelist` descarta campos no
  // declarados en el DTO: la lógica de negocio nunca recibe datos que no pidió.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Un error de dominio se traduce a HTTP en un único lugar.
  app.useGlobalFilters(new DominioExceptionFilter());

  // El frontend de Vite corre en otro origen durante el desarrollo.
  app.enableCors({
    origin: process.env.CORS_ORIGEN ?? 'http://localhost:5173',
  });

  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);

  new Logger('Bootstrap').log(`API escuchando en http://localhost:${puerto}`);
}

void bootstrap();
