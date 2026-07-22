import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { ChatService } from './chat.service';
import { SendMessageDto } from './send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  getMyRooms(@Req() req: AuthenticatedRequest) {
    return this.chatService.getMyRooms(req.user);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.chatService.getRoom(id, req.user);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto, @Req() req: AuthenticatedRequest) {
    return this.chatService.sendMessage(dto, req.user);
  }

  @Patch('rooms/:id/read')
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.chatService.markMessagesAsRead(id, req.user);
  }

  @Get('unread-count')
getUnreadCount(
  @Req() req: AuthenticatedRequest,
) {
  return this.chatService.getUnreadCount(
    req.user,
  );
}
}