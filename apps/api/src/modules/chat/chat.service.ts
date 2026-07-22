import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto } from './send-message.dto';
import { ChatGateway } from './chat.gateway';
import { MessageTemplateService } from './message-template.service';
@Injectable()
export class ChatService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly notificationsService: NotificationsService,
  private readonly chatGateway: ChatGateway,
  private readonly messageTemplateService: MessageTemplateService,
) {}
  async getMyRooms(user: { id: string; role: Role }) {
    return this.prisma.chatRoom.findMany({
      where: {
        OR: [{ buyerId: user.id }, { professionalId: user.id }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        match: {
          include: {
            lead: true,
            buyer: {
              select: { id: true, fullName: true, email: true, role: true },
            },
            professional: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, role: true },
                },
              },
            },
          },
        },
        messages: {
  orderBy: { createdAt: 'desc' },
  take: 1,
},
      },
    });
  }

  async getRoom(id: string, user: { id: string; role: Role }) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id },
      include: {
        match: {
          include: {
            lead: true,
            buyer: {
              select: { id: true, fullName: true, email: true, role: true },
            },
            professional: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, role: true },
                },
              },
            },
          },
        },
        messages: {
  orderBy: { createdAt: 'asc' },
},
      },
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (room.buyerId !== user.id && room.professionalId !== user.id) {
      throw new ForbiddenException('You cannot access this chat room');
    }

    return room;
  }

  async sendMessage(dto: SendMessageDto, user: { id: string; role: Role }) {
  const room = await this.prisma.chatRoom.findUnique({
    where: { id: dto.chatRoomId },
    include: {
      match: {
        include: {
          lead: true,
          buyer: true,
          professional: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    throw new NotFoundException('Chat room not found');
  }

  if (room.buyerId !== user.id && room.professionalId !== user.id) {
    throw new ForbiddenException('You cannot send messages in this room');
  }
  const cleanContent = dto.content.trim();

if (!cleanContent) {
  throw new BadRequestException(
    'Message content is required',
  );
}

if (cleanContent.length > 1000) {
  throw new BadRequestException(
    'Message cannot exceed 1000 characters',
  );
}

  const message = await this.prisma.chatMessage.create({
    data: {
      chatRoomId: dto.chatRoomId,
      senderId: user.id,
      content: cleanContent,
      status: 'SENT',
    },
  });
  this.chatGateway.emitNewMessage(dto.chatRoomId, message);
  await this.prisma.chatRoom.update({
    where: { id: dto.chatRoomId },
    data: { updatedAt: new Date() },
  });

  const receiverId =
    user.id === room.buyerId ? room.professionalId : room.buyerId;

  await this.notificationsService.create({
    userId: receiverId,
    title: 'New message',
    message:
      user.id === room.buyerId
        ? `${room.match.buyer?.fullName || 'Buyer'} sent you a new message.`
        : `${room.match.professional.user.fullName || 'Professional'} sent you a new message.`,
    type: NotificationType.SYSTEM,
  });

  return message;
}

  async markMessagesAsRead(roomId: string, user: { id: string; role: Role }) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (room.buyerId !== user.id && room.professionalId !== user.id) {
      throw new ForbiddenException('You cannot access this chat room');
    }

    await this.prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true,
        status: 'READ',
        readAt: new Date(),
       },
    });

    return { message: 'Messages marked as read' };
  }



  async getUnreadCount(user: {
  id: string;
  role: Role;
}) {
  const count =
    await this.prisma.chatMessage.count({
      where: {
        isRead: false,

        senderId: {
          not: user.id,
        },

        chatRoom: {
          OR: [
            {
              buyerId: user.id,
            },
            {
              professionalId: user.id,
            },
          ],
        },
      },
    });

  return {
    count,
  };
}





}