import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  LeadStatus,
  MatchStatus,
  NotificationType,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageTemplateService } from '../chat/message-template.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly auditService: AuditService,
  ) {}

  /*
   * ============================================================
   * ADMIN — MONITORING ONLY
   * ============================================================
   */

  async findAll(
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can view all matches',
      );
    }

    return this.prisma.match.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        review: true,

        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },

        professional: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        },

        lead: true,

        property: true,

        chatRoom: true,
      },
    });
  }

  /*
   * ============================================================
   * BUYER — PROPERTY CONTACT
   * ============================================================
   *
   * This is intentionally different from automatic lead matching.
   *
   * When a Buyer explicitly contacts a property, we already know
   * exactly which Property Agent owns that property.
   *
   * Therefore:
   *
   * Buyer clicks Contact
   *       ↓
   * Match ACTIVE immediately
   *       ↓
   * Chat room created
   *
   * No Admin.
   * No PENDING.
   * No approval.
   * ============================================================
   */

  async contactProperty(
    propertyId: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can contact a property agent',
      );
    }

    const property =
      await this.prisma.property.findUnique({
        where: {
          id: propertyId,
        },

        include: {
          professionalProfile: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    if (
      property.status !==
      'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Only published properties can be contacted',
      );
    }

    const professional =
      property.professionalProfile;

    /*
     * Look for an already existing relationship.
     *
     * PENDING is included only for backward compatibility
     * with matches created before the new architecture.
     */
    const existingMatch =
      await this.prisma.match.findFirst({
        where: {
          buyerId: user.id,

          professionalId:
            professional.id,

          propertyId:
            property.id,

          status: {
            in: [
              MatchStatus.PENDING,
              MatchStatus.ACTIVE,
              MatchStatus.CONTACTED,
              MatchStatus.COMPLETED,
            ],
          },
        },

        include: {
          chatRoom: true,

          professional: {
            include: {
              user: true,
            },
          },

          property: true,
        },
      });

    if (existingMatch) {
      /*
       * Legacy migration behavior:
       *
       * if an old PENDING property match is encountered,
       * activate it automatically.
       */
      const normalizedMatch =
        existingMatch.status ===
        MatchStatus.PENDING
          ? await this.prisma.match.update({
              where: {
                id: existingMatch.id,
              },

              data: {
                status:
                  MatchStatus.ACTIVE,
              },

              include: {
                chatRoom: true,

                professional: {
                  include: {
                    user: true,
                  },
                },

                property: true,
              },
            })
          : existingMatch;

      const room =
        normalizedMatch.chatRoom ??
        (await this.prisma.chatRoom.create({
          data: {
            matchId:
              normalizedMatch.id,

            buyerId:
              user.id,

            professionalId:
              professional.userId,
          },
        }));

      return {
        alreadyExists: true,
        match: normalizedMatch,
        chatRoom: room,
      };
    }

    const match =
      await this.prisma.match.create({
        data: {
          buyerId:
            user.id,

          professionalId:
            professional.id,

          propertyId:
            property.id,

          score:
            100,

          /*
           * Important:
           * direct activation.
           */
          status:
            MatchStatus.ACTIVE,
        },

        include: {
          professional: {
            include: {
              user: true,
            },
          },

          property: true,
        },
      });

    const room =
      await this.prisma.chatRoom.create({
        data: {
          matchId:
            match.id,

          buyerId:
            user.id,

          professionalId:
            professional.userId,
        },
      });

    await this.notificationsService.create({
      userId:
        professional.userId,

      title:
        'New property inquiry',

      message:
        `A buyer is interested in "${property.title}".`,

      type:
        NotificationType.MATCH,
    });

    await this.auditService.log({
      userId:
        user.id,

      userRole:
        user.role,

      action:
        'PROPERTY_CONTACT_CREATED',

      entity:
        'Match',

      entityId:
        match.id,

      description:
        `Buyer contacted property ${property.id}`,
    });

    return {
      alreadyExists: false,
      match,
      chatRoom: room,
    };
  }

  /*
   * ============================================================
   * PROFESSIONAL — MARK MATCH AS CONTACTED
   * ============================================================
   *
   * ACTIVE
   *   ↓
   * Professional accepts engagement
   *   ↓
   * CONTACTED
   *   ↓
   * Buyer notification
   *   ↓
   * Chat room + automatic introduction message
   * ============================================================
   */

  async markAsContacted(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const match =
      await this.prisma.match.findUnique({
        where: {
          id,
        },

        include: {
          professional: true,
        },
      });

    if (!match) {
      throw new NotFoundException(
        'Match not found',
      );
    }

    if (
      user.role !==
      Role.PROFESSIONAL
    ) {
      throw new ForbiddenException(
        'Only the assigned professional can contact this match',
      );
    }

    if (
      match.professional.userId !==
      user.id
    ) {
      throw new ForbiddenException(
        'You can only contact your own matches',
      );
    }

    if (
      match.status !==
      MatchStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only ACTIVE matches can be marked as contacted',
      );
    }

    const updated =
      await this.prisma.match.update({
        where: {
          id,
        },

        data: {
          status:
            MatchStatus.CONTACTED,
        },

        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },

          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },

          lead: true,

          property: true,
        },
      });

    const buyerUserId =
      updated.buyerId ||
      updated.lead?.userId;

    /*
     * Notify Buyer.
     */
    if (buyerUserId) {
      await this.notificationsService.create({
        userId:
          buyerUserId,

        title:
          'Professional contacted your request',

        message:
          `${
            updated.professional.user
              .fullName ||
            'A professional'
          } has contacted your real estate request.`,

        type:
          NotificationType.MATCH,
      });
    }

    /*
     * Send Buyer email.
     */
    const buyerEmail =
      updated.lead?.email ||
      updated.buyer?.email;

    if (buyerEmail) {
      await this.emailService.sendBuyerContactedEmail({
        buyerEmail,

        buyerName:
          updated.lead?.fullName ||
          updated.buyer?.fullName,

        professionalName:
          updated.professional.user
            .fullName,

        professionalCompany:
          updated.professional
            .companyName,
      });
    }

    /*
     * Create chat automatically.
     */
    if (buyerUserId) {
      const room =
        await this.prisma.chatRoom.upsert({
          where: {
            matchId:
              updated.id,
          },

          update: {},

          create: {
            matchId:
              updated.id,

            buyerId:
              buyerUserId,

            professionalId:
              updated.professional
                .userId,
          },
        });

      /*
       * Do not duplicate automatic intro messages.
       */
      const existingMessage =
        await this.prisma.chatMessage.findFirst({
          where: {
            chatRoomId:
              room.id,
          },
        });

      if (!existingMessage) {
        const introMessage =
          this.messageTemplateService
            .buildProfessionalIntroMessage({
              buyerName:
                updated.buyer
                  ?.fullName ||
                updated.lead
                  ?.fullName,

              professionalName:
                updated.professional
                  .user.fullName,

              companyName:
                updated.professional
                  .companyName,

              professionalType:
                updated.professional
                  .professionalType,

              leadSource:
                updated.lead
                  ?.source,

              leadInterest:
                updated.lead
                  ?.interest,

              leadLocation:
                updated.lead
                  ?.location,

              leadBudget:
                updated.lead
                  ?.budget,
            });

        await this.prisma.chatMessage.create({
          data: {
            chatRoomId:
              room.id,

            senderId:
              updated.professional
                .userId,

            content:
              introMessage,
          },
        });
      }
    }

    await this.auditService.log({
      userId:
        user.id,

      userRole:
        user.role,

      action:
        'MATCH_CONTACTED',

      entity:
        'Match',

      entityId:
        updated.id,

      description:
        `Professional contacted buyer for match ${updated.id}`,
    });

    return updated;
  }

  /*
   * ============================================================
   * PROFESSIONAL — COMPLETE MATCH
   * ============================================================
   *
   * CONTACTED
   *      ↓
   * Professional completes journey
   *      ↓
   * Match = COMPLETED
   *      ↓
   * Lead = CLOSED
   *
   * Admin does not complete matches anymore.
   * ============================================================
   */

  async markAsCompleted(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const match =
      await this.prisma.match.findUnique({
        where: {
          id,
        },

        include: {
          professional: true,
        },
      });

    if (!match) {
      throw new NotFoundException(
        'Match not found',
      );
    }

    /*
     * Only the assigned professional
     * manages the business lifecycle.
     */
    if (
      user.role !==
        Role.PROFESSIONAL ||
      match.professional.userId !==
        user.id
    ) {
      throw new ForbiddenException(
        'Only the assigned professional can complete this match',
      );
    }

    if (
      match.status !==
      MatchStatus.CONTACTED
    ) {
      throw new ForbiddenException(
        'Only CONTACTED matches can be marked as completed',
      );
    }

    const updated =
      await this.prisma.match.update({
        where: {
          id,
        },

        data: {
          status:
            MatchStatus.COMPLETED,
        },

        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },

          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },

          lead: true,

          property: true,
        },
      });

    /*
     * Close associated Lead.
     */
    if (
      updated.leadId
    ) {
      await this.prisma.lead.update({
        where: {
          id: updated.leadId,
        },

        data: {
          status:
            LeadStatus.CLOSED,
        },
      });
    }

    const buyerUserId =
      updated.buyerId ||
      updated.lead?.userId;

    /*
     * Notify Buyer.
     */
    if (buyerUserId) {
      await this.notificationsService.create({
        userId:
          buyerUserId,

        title:
          'Match completed',

        message:
          `Your match with ${
            updated.professional.user
              .fullName ||
            'the professional'
          } has been completed.`,

        type:
          NotificationType.MATCH,
      });
    }

    await this.auditService.log({
      userId:
        user.id,

      userRole:
        user.role,

      action:
        'MATCH_COMPLETED',

      entity:
        'Match',

      entityId:
        updated.id,

      description:
        `Professional completed match ${updated.id}`,
    });

    return updated;
  }

  /*
   * ============================================================
   * BUYER — MY MATCHES
   * ============================================================
   */

  async findByBuyer(
    userId: string,
  ) {
    return this.prisma.match.findMany({
      where: {
        buyerId:
          userId,
      },

      orderBy: {
        createdAt:
          'desc',
      },

      include: {
        review:
          true,

        lead:
          true,

        property:
          true,

        chatRoom:
          true,

        professional: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                phone: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });
  }

  /*
   * ============================================================
   * PROFESSIONAL — MY MATCHES
   * ============================================================
   */

  async findByProfessionalUser(
    userId: string,
  ) {
    const profile =
      await this.prisma.professionalProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      return [];
    }

    return this.prisma.match.findMany({
      where: {
        professionalId:
          profile.id,
      },

      orderBy: {
        createdAt:
          'desc',
      },

      include: {
        review:
          true,

        lead:
          true,

        property:
          true,

        chatRoom:
          true,

        professional: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                phone: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });
  }
}