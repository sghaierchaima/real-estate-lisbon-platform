import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

type NotificationFilter =
  | 'all'
  | 'unread'
  | 'read';

type AuthenticatedUser = {
  id: string;
  role: Role;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  const title = params.title.trim();
  const message = params.message.trim();

  if (!title) {
    throw new BadRequestException(
      'Notification title is required',
    );
  }

  if (!message) {
    throw new BadRequestException(
      'Notification message is required',
    );
  }

  const user = await this.prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new NotFoundException(
      'Notification recipient not found',
    );
  }

  return this.prisma.notification.create({
    data: {
      userId: params.userId,
      title,
      message,
      type: params.type,
    },
  });
}

  async findAll(
    user: AuthenticatedUser,
    filter: NotificationFilter = 'all',
  ) {
    if (
      filter !== 'all' &&
      filter !== 'read' &&
      filter !== 'unread'
    ) {
      throw new BadRequestException(
        'Filter must be all, read or unread',
      );
    }

    return this.prisma.notification.findMany({
      where: {
        userId: user.id,

        ...(filter === 'unread'
          ? {
              isRead: false,
            }
          : {}),

        ...(filter === 'read'
          ? {
              isRead: true,
            }
          : {}),
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async unreadCount(
    user: AuthenticatedUser,
  ) {
    const count =
      await this.prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

    return {
      count,
    };
  }

  async markAsRead(
    id: string,
    user: AuthenticatedUser,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(
    user: AuthenticatedUser,
  ) {
    const result =
      await this.prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

    return {
      message:
        'All notifications marked as read',
      updatedCount: result.count,
    };
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    await this.prisma.notification.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Notification deleted successfully',
    };
  }
}