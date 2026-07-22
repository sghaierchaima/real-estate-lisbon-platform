import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MessageTemplateService } from './message-template.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, MessageTemplateService],
  exports: [ChatService, MessageTemplateService],
})
export class ChatModule {}