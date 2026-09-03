/**
 * Punto de arranque de la API.
 *
 * Aquí solo va configuración transversal del proceso: puerto, CORS, validación global y
 * manejo centralizado de excepciones. Ninguna regla de negocio.
 */
import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DominioExceptionFilter } from './shared/exceptions/dominio-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
