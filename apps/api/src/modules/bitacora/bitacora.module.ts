/**
 * Módulo `bitacora`: auditoría transversal, pedida por el Product Owner el 17 de octubre.
 *
 * Es un módulo aparte porque auditar no pertenece a ninguna épica, le ocurre a todas. Tiene su
 * puerto, su repositorio y su pantalla, y nadie depende de él: lo escribe un middleware en la
 * frontera HTTP y el dominio no se entera.
 *
 * El middleware cubre todas las rutas, por el mismo criterio que el guard de US-003: un endpoint
 * nuevo queda auditado sin hacer nada.
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
