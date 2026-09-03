import { Module } from '@nestjs/common';

import { SaludController } from './presentation/controllers/salud.controller';

@Module({
  controllers: [SaludController],
})
export class SaludModule {}
