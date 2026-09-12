/**
 * Módulo global que expone `PrismaService` a los módulos de negocio.
 * Es `@Global` para no repetir el import en los seis módulos.
 */
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
