import { Module } from '@nestjs/common';

import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { MatchingEngineService } from './matching-engine.service';
import { AutoMatchingService } from './auto-matching.service';

import { PrismaModule } from '../../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    NotificationsModule,
    ChatModule,
    AuditModule,
  ],

  controllers: [
    MatchingController,
  ],

  providers: [
    MatchingService,
    MatchingEngineService,
    AutoMatchingService,
  ],

  exports: [
    MatchingService,
    MatchingEngineService,
    AutoMatchingService,
  ],
})
export class MatchingModule {}