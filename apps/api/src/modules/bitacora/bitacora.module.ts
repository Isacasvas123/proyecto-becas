/**
 * MÓDULO `bitacora` — auditoría transversal del sistema.
 *
 * Exigida por el Product Owner el 17 de octubre de 2026: la base de datos debe llevar bitácora.
 *
 * POR QUÉ ES UN MÓDULO APARTE Y NO UN CAMPO EN CADA TABLA
 *   Auditar no es parte de ninguna épica: le ocurre a todas. Como módulo propio tiene su puerto,
 *   su repositorio y su pantalla, y ningún otro módulo depende de él ni lo menciona. El registro
 *   lo escribe un middleware en la frontera HTTP, así que el dominio ni se entera de que existe.
 *
 * EL MIDDLEWARE SE APLICA A TODAS LAS RUTAS
 *   Por el mismo criterio que el guard de US-003: lo que debe aplicarse siempre se registra una
 *   vez y no depende de que alguien se acuerde. Un endpoint nuevo queda auditado sin hacer nada.
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BitacoraService } from './application/services/bitacora.service';
import { BITACORA_REPOSITORIO } from './domain/ports/bitacora.repositorio';
import { BitacoraPrismaRepositorio } from './infrastructure/persistence/bitacora-prisma.repositorio';
import { BitacoraController } from './presentation/controllers/bitacora.controller';
import { BitacoraMiddleware } from './presentation/bitacora.middleware';

@Module({
  controllers: [BitacoraController],
  providers: [
    BitacoraService,
    BitacoraMiddleware,
    { provide: BITACORA_REPOSITORIO, useClass: BitacoraPrismaRepositorio },
  ],
})
export class BitacoraModule implements NestModule {
  configure(consumidor: MiddlewareConsumer): void {
    // Todas las rutas: lo que debe aplicarse siempre no depende de que alguien lo recuerde.
    consumidor.apply(BitacoraMiddleware).forRoutes('*');
  }
}
