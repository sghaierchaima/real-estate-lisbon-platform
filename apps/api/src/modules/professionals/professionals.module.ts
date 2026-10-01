import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import {
  MatchingModule,
} from '../matching/matching.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  imports: [CloudinaryModule,NotificationsModule, EmailModule,MatchingModule],
})
export class ProfessionalsModule {}