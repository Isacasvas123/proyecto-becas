/**
 * Cliente de Prisma gestionado por el contenedor de NestJS.
 *
 * Vive en `shared/` porque los seis módulos comparten la misma conexión y las
 * transacciones ACID entre módulos son una de las razones por las que elegimos monolito
 * modular (docs/05-arquitectura.md §2.2).
 *
 * Solo lo usan los repositorios de infrastructure/. Que un servicio de application/ o un
 * controlador inyecte esto directamente es motivo de rechazo en el code review.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL establecida.');
    } catch {
      // La API arranca igual: el endpoint /health debe poder responder para diagnosticar,
      // y el equipo trabaja a veces sin Docker levantado. Las rutas que sí necesitan base
      // de datos fallarán con su propio error, que es lo correcto.
      this.logger.error(
        'No se pudo conectar con PostgreSQL. ¿Está levantado `docker compose up -d`?',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
