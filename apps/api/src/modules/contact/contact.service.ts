import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  CreateContactMessageDto,
} from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /*
   * =========================================================
   * PUBLIC
   * Create a contact message
   * =========================================================
   */

  async create(
    dto: CreateContactMessageDto,
  ) {
    const contactMessage =
      await this.prisma.contactMessage.create({
        data: {
          name: dto.name.trim(),

          email:
            dto.email
              .trim()
              .toLowerCase(),

          subject:
            dto.subject.trim(),

          message:
            dto.message.trim(),
        },

        select: {
          id: true,
          createdAt: true,
        },
      });

    return {
      success: true,

      message:
        'Your message has been received.',

      contactMessage,
    };
  }

  /*
   * =========================================================
   * ADMIN
   * Get all contact messages
   * =========================================================
   */

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /*
   * =========================================================
   * ADMIN
   * Get one message
   * =========================================================
   */

  async findOne(id: string) {
    const message =
      await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

    if (!message) {
      throw new NotFoundException(
        'Contact message not found',
      );
    }

    return message;
  }

  /*
   * =========================================================
   * ADMIN
   * Mark message as read
   * =========================================================
   */

  async markAsRead(id: string) {
    await this.findOne(id);

    return this.prisma.contactMessage.update({
      where: {
        id,
      },

      data: {
        isRead: true,
      },
    });
  }

  /*
   * =========================================================
   * ADMIN
   * Mark message as unread
   * =========================================================
   */

  async markAsUnread(id: string) {
    await this.findOne(id);

    return this.prisma.contactMessage.update({
      where: {
        id,
      },

      data: {
        isRead: false,
      },
    });
  }

  /*
   * =========================================================
   * ADMIN
   * Delete message
   * =========================================================
   */

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.contactMessage.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Contact message deleted.',
    };
  }
}