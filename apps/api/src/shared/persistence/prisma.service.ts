/**
 * Cliente de Prisma gestionado por el contenedor de NestJS. Vive en `shared/` porque los módulos
 * comparten la conexión y las transacciones entre módulos son una razón del monolito modular
 * (docs/05-arquitectura.md §2.2).
 *
 * Solo lo usan los repositorios de infrastructure/: inyectarlo en un servicio o un controlador es
 * motivo de rechazo en el code review.
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
      // Decisión deliberada: la API arranca aunque no haya base de datos.
      //
      // Motivo: el equipo trabaja a veces sin Docker levantado, y si el proceso muriera al
      // arrancar nadie podría diagnosticar la causa. Las rutas que sí necesitan base de
      // datos fallarán con su propio error, que es lo correcto.
      //
      // El riesgo que esto introduce y cómo se mitiga:
      // arrancar sin base de datos hacía que `GET /health` respondiera `ok` con el sistema
      // inservible. Por eso existe `GET /ready`, que sí consulta PostgreSQL y devuelve 503
      // si no responde. El orquestador y el monitoreo deben apuntar a `/ready`, no a
      // `/health`. Ver `modules/salud/presentation/controllers/salud.controller.ts`.
      this.logger.error(
        'No se pudo conectar con PostgreSQL. ¿Está levantado `docker compose up -d`? ' +
          'La API arranca igual, pero GET /ready responderá 503 hasta que la conexión exista.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
