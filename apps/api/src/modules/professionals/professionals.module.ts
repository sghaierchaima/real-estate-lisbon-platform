import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  imports: [NotificationsModule, EmailModule],
})
export class ProfessionalsModule {}