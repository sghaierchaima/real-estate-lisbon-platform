import {
  ForbiddenException,
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

import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  let service: MatchingService;

  let prisma: {
    match: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };

    property: {
      findUnique: jest.Mock;
    };

    professionalProfile: {
      findUnique: jest.Mock;
    };

    chatRoom: {
      create: jest.Mock;
      upsert: jest.Mock;
    };

    chatMessage: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };

    lead: {
      update: jest.Mock;
    };
  };

  let emailService: {
    sendBuyerContactedEmail: jest.Mock;
  };

  let notificationsService: {
    create: jest.Mock;
  };

  let messageTemplateService: {
    buildProfessionalIntroMessage: jest.Mock;
  };

  let auditService: {
    log: jest.Mock;
  };

  const adminUser = {
    id: 'admin-1',
    role: Role.ADMIN,
  };

  const buyerUser = {
    id: 'buyer-1',
    role: Role.BUYER,
  };

  const professionalUser = {
    id: 'professional-user-1',
    role: Role.PROFESSIONAL,
  };

  const professionalProfile = {
    id: 'professional-profile-1',
    userId: professionalUser.id,
    companyName: 'Lisbon Prime Realty',
    professionalType: 'PROPERTY_AGENT',
    user: {
      id: professionalUser.id,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
    },
  };

  const property = {
    id: 'property-1',
    title: 'Modern Lisbon Apartment',
    status: 'PUBLISHED',
    professionalProfileId:
      professionalProfile.id,
    professionalProfile,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      match: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },

      property: {
        findUnique: jest.fn(),
      },

      professionalProfile: {
        findUnique: jest.fn(),
      },

      chatRoom: {
        create: jest.fn(),
        upsert: jest.fn(),
      },

      chatMessage: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },

      lead: {
        update: jest.fn(),
      },
    };

    emailService = {
      sendBuyerContactedEmail:
        jest.fn(),
    };

    notificationsService = {
      create: jest.fn(),
    };

    messageTemplateService = {
      buildProfessionalIntroMessage:
        jest.fn(),
    };

    auditService = {
      log: jest.fn(),
    };

    service = new MatchingService(
      prisma as unknown as PrismaService,
      emailService as unknown as EmailService,
      notificationsService as unknown as NotificationsService,
      messageTemplateService as unknown as MessageTemplateService,
      auditService as unknown as AuditService,
    );
  });

  // ============================================================
  // INITIALIZATION
  // ============================================================

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================
  // FIND ALL — ADMIN MONITORING
  // ============================================================

  describe('findAll', () => {
    it('should allow admin to monitor all matches', async () => {
      const matches = [
        {
          id: 'match-1',
          status: MatchStatus.ACTIVE,
        },
        {
          id: 'match-2',
          status: MatchStatus.COMPLETED,
        },
      ];

      prisma.match.findMany.mockResolvedValue(
        matches,
      );

      const result =
        await service.findAll(adminUser);

      expect(result).toEqual(matches);

      expect(
        prisma.match.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        }),
      );
    });

    it('should reject buyer from viewing all matches', async () => {
      await expect(
        service.findAll(buyerUser),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prisma.match.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should reject professional from viewing all matches', async () => {
      await expect(
        service.findAll(
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  // ============================================================
  // CONTACT PROPERTY
  // ============================================================

  describe('contactProperty', () => {
    it('should reject non buyer users', async () => {
      await expect(
        service.contactProperty(
          property.id,
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prisma.property.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.contactProperty(
          'missing-property',
          buyerUser,
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should reject unpublished property', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ...property,
        status: 'DRAFT',
      });

      await expect(
        service.contactProperty(
          property.id,
          buyerUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prisma.match.create,
      ).not.toHaveBeenCalled();
    });

    it('should create ACTIVE property match directly without admin approval', async () => {
      prisma.property.findUnique.mockResolvedValue(
        property,
      );

      prisma.match.findFirst.mockResolvedValue(
        null,
      );

      const createdMatch = {
        id: 'match-1',

        buyerId:
          buyerUser.id,

        professionalId:
          professionalProfile.id,

        propertyId:
          property.id,

        score:
          100,

        status:
          MatchStatus.ACTIVE,

        professional:
          professionalProfile,

        property,
      };

      prisma.match.create.mockResolvedValue(
        createdMatch,
      );

      const room = {
        id: 'room-1',
        matchId: createdMatch.id,
        buyerId: buyerUser.id,
        professionalId:
          professionalUser.id,
      };

      prisma.chatRoom.create.mockResolvedValue(
        room,
      );

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      const result =
        await service.contactProperty(
          property.id,
          buyerUser,
        );

      expect(
        prisma.match.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            buyerId:
              buyerUser.id,

            professionalId:
              professionalProfile.id,

            propertyId:
              property.id,

            score:
              100,

            status:
              MatchStatus.ACTIVE,
          },
        }),
      );

      expect(
        prisma.chatRoom.create,
      ).toHaveBeenCalledWith({
        data: {
          matchId:
            createdMatch.id,

          buyerId:
            buyerUser.id,

          professionalId:
            professionalUser.id,
        },
      });

      expect(
        notificationsService.create,
      ).toHaveBeenCalledWith({
        userId:
          professionalUser.id,

        title:
          'New property inquiry',

        message:
          `A buyer is interested in "${property.title}".`,

        type:
          NotificationType.MATCH,
      });

      expect(
        auditService.log,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId:
            buyerUser.id,

          userRole:
            Role.BUYER,

          action:
            'PROPERTY_CONTACT_CREATED',

          entity:
            'Match',

          entityId:
            createdMatch.id,
        }),
      );

      expect(result).toEqual({
        alreadyExists: false,
        match: createdMatch,
        chatRoom: room,
      });
    });

    it('should return existing ACTIVE match instead of creating duplicate', async () => {
      prisma.property.findUnique.mockResolvedValue(
        property,
      );

      const existingMatch = {
        id: 'match-existing',

        buyerId:
          buyerUser.id,

        professionalId:
          professionalProfile.id,

        propertyId:
          property.id,

        status:
          MatchStatus.ACTIVE,

        chatRoom: {
          id: 'room-existing',
        },

        professional:
          professionalProfile,

        property,
      };

      prisma.match.findFirst.mockResolvedValue(
        existingMatch,
      );

      const result =
        await service.contactProperty(
          property.id,
          buyerUser,
        );

      expect(
        prisma.match.create,
      ).not.toHaveBeenCalled();

      expect(
        prisma.match.update,
      ).not.toHaveBeenCalled();

      expect(
        prisma.chatRoom.create,
      ).not.toHaveBeenCalled();

      expect(result).toEqual({
        alreadyExists: true,
        match: existingMatch,
        chatRoom:
          existingMatch.chatRoom,
      });
    });

    it('should create chat room when existing match has no chat room', async () => {
      prisma.property.findUnique.mockResolvedValue(
        property,
      );

      const existingMatch = {
        id: 'match-existing',

        buyerId:
          buyerUser.id,

        professionalId:
          professionalProfile.id,

        propertyId:
          property.id,

        status:
          MatchStatus.ACTIVE,

        chatRoom:
          null,

        professional:
          professionalProfile,

        property,
      };

      prisma.match.findFirst.mockResolvedValue(
        existingMatch,
      );

      const room = {
        id: 'room-new',
        matchId:
          existingMatch.id,
      };

      prisma.chatRoom.create.mockResolvedValue(
        room,
      );

      const result =
        await service.contactProperty(
          property.id,
          buyerUser,
        );

      expect(
        prisma.chatRoom.create,
      ).toHaveBeenCalledWith({
        data: {
          matchId:
            existingMatch.id,

          buyerId:
            buyerUser.id,

          professionalId:
            professionalUser.id,
        },
      });

      expect(result.chatRoom).toEqual(
        room,
      );
    });

    it('should automatically upgrade legacy PENDING property match to ACTIVE', async () => {
      prisma.property.findUnique.mockResolvedValue(
        property,
      );

      const legacyMatch = {
        id: 'legacy-match',

        buyerId:
          buyerUser.id,

        professionalId:
          professionalProfile.id,

        propertyId:
          property.id,

        status:
          MatchStatus.PENDING,

        chatRoom:
          null,

        professional:
          professionalProfile,

        property,
      };

      prisma.match.findFirst.mockResolvedValue(
        legacyMatch,
      );

      const activatedMatch = {
        ...legacyMatch,
        status:
          MatchStatus.ACTIVE,
      };

      prisma.match.update.mockResolvedValue(
        activatedMatch,
      );

      const room = {
        id: 'room-legacy',
        matchId:
          legacyMatch.id,
      };

      prisma.chatRoom.create.mockResolvedValue(
        room,
      );

      const result =
        await service.contactProperty(
          property.id,
          buyerUser,
        );

      expect(
        prisma.match.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id:
              legacyMatch.id,
          },

          data: {
            status:
              MatchStatus.ACTIVE,
          },
        }),
      );

      expect(
        prisma.match.create,
      ).not.toHaveBeenCalled();

      expect(
        result.match.status,
      ).toBe(
        MatchStatus.ACTIVE,
      );
    });

    it('should search existing property relationships including legacy and lifecycle statuses', async () => {
      prisma.property.findUnique.mockResolvedValue(
        property,
      );

      prisma.match.findFirst.mockResolvedValue({
        id: 'match-1',
        status:
          MatchStatus.ACTIVE,
        chatRoom: {
          id: 'room-1',
        },
        professional:
          professionalProfile,
        property,
      });

      await service.contactProperty(
        property.id,
        buyerUser,
      );

      expect(
        prisma.match.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            buyerId:
              buyerUser.id,

            professionalId:
              professionalProfile.id,

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
        }),
      );
    });
  });

  // ============================================================
  // MARK AS CONTACTED
  // ============================================================

  describe('markAsContacted', () => {
    const baseMatch = {
      id: 'match-1',

      buyerId:
        buyerUser.id,

      professionalId:
        professionalProfile.id,

      leadId:
        'lead-1',

      status:
        MatchStatus.ACTIVE,

      professional:
        professionalProfile,
    };

    it('should throw when match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.markAsContacted(
          'missing-match',
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should reject buyer from marking match as contacted', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      await expect(
        service.markAsContacted(
          baseMatch.id,
          buyerUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should reject another professional', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      await expect(
        service.markAsContacted(
          baseMatch.id,
          {
            id: 'another-professional',
            role:
              Role.PROFESSIONAL,
          },
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should only allow ACTIVE match to become CONTACTED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,
      });

      await expect(
        service.markAsContacted(
          baseMatch.id,
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prisma.match.update,
      ).not.toHaveBeenCalled();
    });

    it('should change ACTIVE match to CONTACTED', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id: buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
          role:
            Role.BUYER,
        },

        lead: {
          id: 'lead-1',
          userId:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
          source:
            'Mortgage Calculator',
          interest:
            'Mortgage financing',
          location:
            'Lisbon',
          budget:
            450000,
        },

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
        matchId:
          updatedMatch.id,
      });

      prisma.chatMessage.findFirst.mockResolvedValue(
        null,
      );

      messageTemplateService.buildProfessionalIntroMessage.mockReturnValue(
        'Hello, I am Ana Costa.',
      );

      prisma.chatMessage.create.mockResolvedValue({
        id: 'message-1',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      const result =
        await service.markAsContacted(
          baseMatch.id,
          professionalUser,
        );

      expect(
        prisma.match.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id:
              baseMatch.id,
          },

          data: {
            status:
              MatchStatus.CONTACTED,
          },
        }),
      );

      expect(result.status).toBe(
        MatchStatus.CONTACTED,
      );
    });

    it('should notify buyer after professional contacts request', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
        },

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
      });

      prisma.chatMessage.findFirst.mockResolvedValue({
        id: 'existing-message',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

      expect(
        notificationsService.create,
      ).toHaveBeenCalledWith({
        userId:
          buyerUser.id,

        title:
          'Professional contacted your request',

        message:
          'Ana Costa has contacted your real estate request.',

        type:
          NotificationType.MATCH,
      });
    });

    it('should send buyer contacted email', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
        },

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
      });

      prisma.chatMessage.findFirst.mockResolvedValue({
        id: 'message-existing',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

      expect(
        emailService.sendBuyerContactedEmail,
      ).toHaveBeenCalledWith({
        buyerEmail:
          'buyer@example.com',

        buyerName:
          'Buyer Lisbon',

        professionalName:
          'Ana Costa',

        professionalCompany:
          'Lisbon Prime Realty',
      });
    });

    it('should create chat room automatically', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
        },

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
      });

      prisma.chatMessage.findFirst.mockResolvedValue({
        id: 'existing-message',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

      expect(
        prisma.chatRoom.upsert,
      ).toHaveBeenCalledWith({
        where: {
          matchId:
            baseMatch.id,
        },

        update: {},

        create: {
          matchId:
            baseMatch.id,

          buyerId:
            buyerUser.id,

          professionalId:
            professionalUser.id,
        },
      });
    });

    it('should create automatic intro message when chat is empty', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
        },

        lead: {
          id:
            'lead-1',
          userId:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
          source:
            'Affordability Calculator',
          interest:
            'Mortgage affordability',
          location:
            'Lisbon',
          budget:
            500000,
        },

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
      });

      prisma.chatMessage.findFirst.mockResolvedValue(
        null,
      );

      messageTemplateService.buildProfessionalIntroMessage.mockReturnValue(
        'Professional introduction',
      );

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

      expect(
        messageTemplateService.buildProfessionalIntroMessage,
      ).toHaveBeenCalledWith({
        buyerName:
          'Buyer Lisbon',

        professionalName:
          'Ana Costa',

        companyName:
          'Lisbon Prime Realty',

        professionalType:
          'PROPERTY_AGENT',

        leadSource:
          'Affordability Calculator',

        leadInterest:
          'Mortgage affordability',

        leadLocation:
          'Lisbon',

        leadBudget:
          500000,
      });

      expect(
        prisma.chatMessage.create,
      ).toHaveBeenCalledWith({
        data: {
          chatRoomId:
            'room-1',

          senderId:
            professionalUser.id,

          content:
            'Professional introduction',
        },
      });
    });

    it('should not duplicate automatic intro message', async () => {
      prisma.match.findUnique.mockResolvedValue(
        baseMatch,
      );

      const updatedMatch = {
        ...baseMatch,

        status:
          MatchStatus.CONTACTED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer',
          email:
            'buyer@example.com',
        },

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        updatedMatch,
      );

      prisma.chatRoom.upsert.mockResolvedValue({
        id: 'room-1',
      });

      prisma.chatMessage.findFirst.mockResolvedValue({
        id: 'existing-message',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      emailService.sendBuyerContactedEmail.mockResolvedValue(
        undefined,
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

      expect(
        prisma.chatMessage.create,
      ).not.toHaveBeenCalled();

      expect(
        messageTemplateService.buildProfessionalIntroMessage,
      ).not.toHaveBeenCalled();
    });

    it(
  'should audit CONTACTED transition',
  async () => {
    prisma.match.findUnique.mockResolvedValue(
      baseMatch,
    );

    const updatedMatch = {
      ...baseMatch,

      status:
        MatchStatus.CONTACTED,

      buyer: {
        id:
          buyerUser.id,

        fullName:
          'Buyer Lisbon',

        email:
          'buyer@example.com',
      },

      lead:
        null,

      property:
        null,

      professional:
        professionalProfile,
    };

    prisma.match.update.mockResolvedValue(
      updatedMatch,
    );

    /*
     * buyerId exists in baseMatch,
     * therefore MatchingService creates
     * or retrieves the chat room.
     */
    prisma.chatRoom.upsert.mockResolvedValue({
      id:
        'room-audit-1',

      matchId:
        updatedMatch.id,

      buyerId:
        buyerUser.id,

      professionalId:
        professionalUser.id,
    });

    /*
     * An existing message prevents
     * creation of another intro message.
     */
    prisma.chatMessage.findFirst.mockResolvedValue({
      id:
        'existing-message',
    });

    notificationsService.create.mockResolvedValue(
      {},
    );

    emailService.sendBuyerContactedEmail.mockResolvedValue(
      undefined,
    );

    auditService.log.mockResolvedValue(
      undefined,
    );

    const result =
      await service.markAsContacted(
        baseMatch.id,
        professionalUser,
      );

    expect(
      result,
    ).toEqual(
      updatedMatch,
    );

    expect(
      prisma.chatRoom.upsert,
    ).toHaveBeenCalledWith({
      where: {
        matchId:
          updatedMatch.id,
      },

      update: {},

      create: {
        matchId:
          updatedMatch.id,

        buyerId:
          buyerUser.id,

        professionalId:
          professionalUser.id,
      },
    });

    expect(
      auditService.log,
    ).toHaveBeenCalledWith({
      userId:
        professionalUser.id,

      userRole:
        Role.PROFESSIONAL,

      action:
        'MATCH_CONTACTED',

      entity:
        'Match',

      entityId:
        updatedMatch.id,

      description:
        `Professional contacted buyer for match ${updatedMatch.id}`,
    });
  },
);
  });

  // ============================================================
  // MARK AS COMPLETED
  // ============================================================

  describe('markAsCompleted', () => {
    const contactedMatch = {
      id: 'match-1',

      buyerId:
        buyerUser.id,

      professionalId:
        professionalProfile.id,

      leadId:
        'lead-1',

      status:
        MatchStatus.CONTACTED,

      professional:
        professionalProfile,
    };

    it('should throw when match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.markAsCompleted(
          'missing-match',
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should reject buyer from completing match', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      await expect(
        service.markAsCompleted(
          contactedMatch.id,
          buyerUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should reject another professional from completing match', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      await expect(
        service.markAsCompleted(
          contactedMatch.id,
          {
            id:
              'other-professional',
            role:
              Role.PROFESSIONAL,
          },
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should only allow CONTACTED match to become COMPLETED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        ...contactedMatch,

        status:
          MatchStatus.ACTIVE,
      });

      await expect(
        service.markAsCompleted(
          contactedMatch.id,
          professionalUser,
        ),
      ).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(
        prisma.match.update,
      ).not.toHaveBeenCalled();
    });

    it('should change CONTACTED match to COMPLETED', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      const completedMatch = {
        ...contactedMatch,

        status:
          MatchStatus.COMPLETED,

        buyer: {
          id:
            buyerUser.id,
          fullName:
            'Buyer Lisbon',
          email:
            'buyer@example.com',
        },

        lead: {
          id:
            'lead-1',
          userId:
            buyerUser.id,
        },

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        completedMatch,
      );

      prisma.lead.update.mockResolvedValue({
        id:
          'lead-1',
        status:
          LeadStatus.CLOSED,
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      const result =
        await service.markAsCompleted(
          contactedMatch.id,
          professionalUser,
        );

      expect(
        prisma.match.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id:
              contactedMatch.id,
          },

          data: {
            status:
              MatchStatus.COMPLETED,
          },
        }),
      );

      expect(result.status).toBe(
        MatchStatus.COMPLETED,
      );
    });

    it('should close associated lead after match completion', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      const completedMatch = {
        ...contactedMatch,

        status:
          MatchStatus.COMPLETED,

        buyer:
          null,

        lead: {
          id:
            'lead-1',
          userId:
            buyerUser.id,
        },

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        completedMatch,
      );

      prisma.lead.update.mockResolvedValue({
        id:
          'lead-1',
      });

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsCompleted(
        contactedMatch.id,
        professionalUser,
      );

      expect(
        prisma.lead.update,
      ).toHaveBeenCalledWith({
        where: {
          id:
            'lead-1',
        },

        data: {
          status:
            LeadStatus.CLOSED,
        },
      });
    });

    it('should not update lead when match has no lead', async () => {
      const matchWithoutLead = {
        ...contactedMatch,

        leadId:
          null,
      };

      prisma.match.findUnique.mockResolvedValue(
        matchWithoutLead,
      );

      const completedMatch = {
        ...matchWithoutLead,

        status:
          MatchStatus.COMPLETED,

        buyer: {
          id:
            buyerUser.id,
        },

        lead:
          null,

        property,
        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        completedMatch,
      );

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsCompleted(
        contactedMatch.id,
        professionalUser,
      );

      expect(
        prisma.lead.update,
      ).not.toHaveBeenCalled();
    });

    it('should notify buyer after match completion', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      const completedMatch = {
        ...contactedMatch,

        status:
          MatchStatus.COMPLETED,

        buyer: {
          id:
            buyerUser.id,
        },

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        completedMatch,
      );

      prisma.lead.update.mockResolvedValue(
        {},
      );

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsCompleted(
        contactedMatch.id,
        professionalUser,
      );

      expect(
        notificationsService.create,
      ).toHaveBeenCalledWith({
        userId:
          buyerUser.id,

        title:
          'Match completed',

        message:
          'Your match with Ana Costa has been completed.',

        type:
          NotificationType.MATCH,
      });
    });

    it('should audit match completion', async () => {
      prisma.match.findUnique.mockResolvedValue(
        contactedMatch,
      );

      const completedMatch = {
        ...contactedMatch,

        status:
          MatchStatus.COMPLETED,

        buyer:
          null,

        lead:
          null,

        property:
          null,

        professional:
          professionalProfile,
      };

      prisma.match.update.mockResolvedValue(
        completedMatch,
      );

      notificationsService.create.mockResolvedValue(
        {},
      );

      auditService.log.mockResolvedValue(
        undefined,
      );

      await service.markAsCompleted(
        contactedMatch.id,
        professionalUser,
      );

      expect(
        auditService.log,
      ).toHaveBeenCalledWith({
        userId:
          professionalUser.id,

        userRole:
          Role.PROFESSIONAL,

        action:
          'MATCH_COMPLETED',

        entity:
          'Match',

        entityId:
          completedMatch.id,

        description:
          `Professional completed match ${completedMatch.id}`,
      });
    });
  });

  // ============================================================
  // BUYER — MY MATCHES
  // ============================================================

  describe('findByBuyer', () => {
    it('should return buyer own matches', async () => {
      const matches = [
        {
          id: 'match-1',
          buyerId:
            buyerUser.id,
        },
      ];

      prisma.match.findMany.mockResolvedValue(
        matches,
      );

      const result =
        await service.findByBuyer(
          buyerUser.id,
        );

      expect(result).toEqual(matches);

      expect(
        prisma.match.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            buyerId:
              buyerUser.id,
          },

          orderBy: {
            createdAt:
              'desc',
          },
        }),
      );
    });
  });

  // ============================================================
  // PROFESSIONAL — MY MATCHES
  // ============================================================

  describe('findByProfessionalUser', () => {
    it('should return empty array when professional profile does not exist', async () => {
      prisma.professionalProfile.findUnique.mockResolvedValue(
        null,
      );

      const result =
        await service.findByProfessionalUser(
          professionalUser.id,
        );

      expect(result).toEqual([]);

      expect(
        prisma.match.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should return professional own matches', async () => {
      prisma.professionalProfile.findUnique.mockResolvedValue(
        professionalProfile,
      );

      const matches = [
        {
          id:
            'match-1',

          professionalId:
            professionalProfile.id,

          status:
            MatchStatus.ACTIVE,
        },
      ];

      prisma.match.findMany.mockResolvedValue(
        matches,
      );

      const result =
        await service.findByProfessionalUser(
          professionalUser.id,
        );

      expect(result).toEqual(matches);

      expect(
        prisma.professionalProfile.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId:
            professionalUser.id,
        },
      });

      expect(
        prisma.match.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            professionalId:
              professionalProfile.id,
          },

          orderBy: {
            createdAt:
              'desc',
          },
        }),
      );
    });
  });
});