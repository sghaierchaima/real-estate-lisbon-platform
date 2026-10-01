import { Module } from '@nestjs/common';

import { BuyerJourneysController } from './buyer-journeys.controller';
import { BuyerJourneysService } from './buyer-journeys.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BuyerJourneysController],
  providers: [
    BuyerJourneysService,
    PrismaService,
  ],
  exports: [BuyerJourneysService],
})
export class BuyerJourneysModule {}