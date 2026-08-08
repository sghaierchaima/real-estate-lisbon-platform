import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../email/email.service';
import {
  LeadStatus,
  MatchStatus,
  ProfessionalType,
  Role,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { MatchingEngineService } from './matching-engine.service';
import {MessageTemplateService} from '../chat/message-template.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MatchingService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly emailService: EmailService,
  private readonly notificationsService: NotificationsService,
  private readonly matchingEngineService: MatchingEngineService,
  private readonly messageTemplateService: MessageTemplateService,
  private readonly auditService: AuditService,
) {}

  async findAll(user: { id: string; role: Role }) {
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
    },
  });
}

  async generateForLead(leadId: string, user: { id: string; role: Role }) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException('Only admin can generate matches');
  }

  const lead = await this.prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new NotFoundException('Lead not found');
  }

  const professionalType = this.detectProfessionalType(
    `${lead.source || ''} ${lead.interest || ''}`,
  );

  const professionals = await this.prisma.professionalProfile.findMany({
    where: {
      professionalType,
      verificationStatus: VerificationStatus.ACTIVE,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { rating: 'desc' },
      { profileCompletion: 'desc' },
    ],
    take: 5,
  });

  if (professionals.length === 0) {
    throw new NotFoundException(
      `No active professionals found for ${professionalType}`,
    );
  }

  const createdMatches: any[] = [];

  for (const professional of professionals) {
    const existingMatch = await this.prisma.match.findFirst({
      where: {
        leadId: lead.id,
        professionalId: professional.id,
      },
    });

    if (existingMatch) {
      createdMatches.push(existingMatch);
      continue;
    }

const score = this.matchingEngineService.calculateScore(lead, professional);

    const match = await this.prisma.match.create({
      data: {
        buyerId: lead.userId || null,
        leadId: lead.id,
        professionalId: professional.id,
        score,
        status: MatchStatus.PENDING,
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
      },
    });

    createdMatches.push(match);
  }

  await this.prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: LeadStatus.MATCHED,
    },
  });

  return {
    message: 'Matches generated successfully',
    count: createdMatches.length,
    professionalType,
    matches: createdMatches,
  };
}

  async approve(id: string, user: { id: string; role: Role }) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException('Only admin can approve matches');
  }
  const existingMatch = await this.prisma.match.findUnique({
  where: { id },
});

if (!existingMatch) {
  throw new NotFoundException('Match not found');
}

if (existingMatch.status !== MatchStatus.PENDING) {
  throw new ForbiddenException(
    'Only pending matches can be approved',
  );
}
  

  const match = await this.prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.ACTIVE,
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
    },
  });

  await this.notificationsService.create({
    userId: match.professional.userId,
    title: 'New approved match',
    message: `A buyer lead has been approved for you: ${
      match.lead?.fullName || match.lead?.email || 'New buyer'
    }`,
    type: NotificationType.MATCH,
  });

  await this.emailService.sendMatchApprovedEmail({
    professionalEmail: match.professional.user.email,
    professionalName: match.professional.user.fullName,
    buyerName: match.lead?.fullName || match.buyer?.fullName,
    leadLocation: match.lead?.location,
    matchId: match.id,
  });
  await this.auditService.log({
  userId: user.id,
  userRole: user.role,
  action: 'MATCH_APPROVED',
  entity: 'Match',
  entityId: match.id,
  description: `Admin approved match ${match.id}`,
});
  

  return match;
}

async reject(id: string, user: { id: string; role: Role }) {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException('Only admin can reject matches');
  }
  const existingMatch = await this.prisma.match.findUnique({
    where: { id },
  });

  if (!existingMatch) {
    throw new NotFoundException('Match not found');
  }

  if (existingMatch.status !== MatchStatus.PENDING) {
    throw new ForbiddenException(
      'Only pending matches can be rejected',
    );
  }

  const match = await this.prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.CANCELLED,
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
    },
  });

  await this.notificationsService.create({
    userId: match.professional.userId,
    title: 'Match rejected',
    message: `A proposed buyer match was rejected by the admin.`,
    type: NotificationType.MATCH,
  });
  await this.auditService.log({
  userId: user.id,
  userRole: user.role,
  action: 'MATCH_REJECTED',
  entity: 'Match',
  entityId: match.id,
  description: `Admin rejected match ${match.id}`,
});

  return match;
}

  private detectProfessionalType(text: string): ProfessionalType {
  const value = text.toLowerCase();

  // Valuation / Price checker
  if (
    value.includes('property valuation') ||
    value.includes('valuation') ||
    value.includes('appraisal') ||
    value.includes('price checker') ||
    value.includes('estimate')
  ) {
    return ProfessionalType.PROPERTY_VALUER;
  }

  // Mortgage / Affordability
  if (
    value.includes('mortgage') ||
    value.includes('affordability') ||
    value.includes('loan') ||
    value.includes('financing') ||
    value.includes('finance') ||
    value.includes('credit') ||
    value.includes('bank')
  ) {
    return ProfessionalType.MORTGAGE_BROKER;
  }

  // Legal assistance
  if (
    value.includes('legal support') ||
    value.includes('lawyer') ||
    value.includes('legal') ||
    value.includes('contract') ||
    value.includes('cpcv') ||
    value.includes('solicitor') ||
    value.includes('notary')
  ) {
    return ProfessionalType.PROPERTY_LAWYER;
  }

  // Taxes / Purchase costs
  if (
    value.includes('true cost') ||
    value.includes('buying costs') ||
    value.includes('tax advisor') ||
    value.includes('tax') ||
    value.includes('taxes') ||
    value.includes('fiscal') ||
    value.includes('imt') ||
    value.includes('stamp duty') ||
    value.includes('irs')
  ) {
    return ProfessionalType.TAX_ADVISOR;
  }

  // Inspection
  if (
    value.includes('inspection') ||
    value.includes('inspector') ||
    value.includes('survey') ||
    value.includes('property condition')
  ) {
    return ProfessionalType.HOME_INSPECTOR;
  }

  // Insurance
  if (
    value.includes('insurance') ||
    value.includes('insured') ||
    value.includes('coverage')
  ) {
    return ProfessionalType.INSURANCE_BROKER;
  }

  // Property search / Neighborhood
  if (
    value.includes('property search') ||
    value.includes('property search assistant') ||
    value.includes('neighborhood finder') ||
    value.includes('neighborhood') ||
    value.includes('district') ||
    value.includes('community') ||
    value.includes('relocation') ||
    value.includes('buy to live')
  ) {
    return ProfessionalType.PROPERTY_AGENT;
  }

  return ProfessionalType.PROPERTY_AGENT;
}

async contactProperty(
  propertyId: string,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException(
      'Only buyers can contact a property agent',
    );
  }

  const property = await this.prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      professionalProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!property) {
    throw new NotFoundException('Property not found');
  }

  if (property.status !== 'PUBLISHED') {
    throw new ForbiddenException(
      'Only published properties can be contacted',
    );
  }

  const professional = property.professionalProfile;

  const existingMatch = await this.prisma.match.findFirst({
    where: {
      buyerId: user.id,
      professionalId: professional.id,
      propertyId: property.id,
      status: {
        in: [
          MatchStatus.PENDING,
          MatchStatus.ACTIVE,
          MatchStatus.CONTACTED,
        ],
      },
    },
    include: {
      chatRoom: true,
    },
  });

  if (existingMatch) {
    const room =
      existingMatch.chatRoom ??
      (await this.prisma.chatRoom.create({
        data: {
          matchId: existingMatch.id,
          buyerId: user.id,
          professionalId: professional.userId,
        },
      }));

    return {
      alreadyExists: true,
      match: existingMatch,
      chatRoom: room,
    };
  }

  const match = await this.prisma.match.create({
    data: {
      buyerId: user.id,
      professionalId: professional.id,
      propertyId: property.id,
      score: 100,
      status: MatchStatus.ACTIVE,
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

  const room = await this.prisma.chatRoom.create({
    data: {
      matchId: match.id,
      buyerId: user.id,
      professionalId: professional.userId,
    },
  });

  await this.notificationsService.create({
    userId: professional.userId,
    title: 'New property inquiry',
    message: `A buyer is interested in "${property.title}".`,
    type: NotificationType.MATCH,
  });

  await this.auditService.log({
    userId: user.id,
    userRole: user.role,
    action: 'PROPERTY_CONTACT_CREATED',
    entity: 'Match',
    entityId: match.id,
    description: `Buyer contacted property ${property.id}`,
  });

  return {
    alreadyExists: false,
    match,
    chatRoom: room,
  };
}
  
  
async markAsContacted(id: string, user: { id: string; role: Role }) {
  const match = await this.prisma.match.findUnique({
    where: { id },
    include: {
      professional: true,
    },
  });

  if (!match) {
    throw new NotFoundException('Match not found');
  }

  if (user.role !== Role.PROFESSIONAL) {
  throw new ForbiddenException(
    'Only the assigned professional can contact this match',
  );
}

if (match.professional.userId !== user.id) {
  throw new ForbiddenException(
    'You can only contact your own matches',
  );
}

  if (match.status !== MatchStatus.ACTIVE) {
  throw new ForbiddenException(
    'Only active matches can be marked as contacted',
  );
}

  const updated = await this.prisma.match.update({
  where: { id },
  data: { status: MatchStatus.CONTACTED },
  include: {
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
    lead: true,
  },
});
const buyerUserId = updated.buyerId || updated.lead?.userId;

if (buyerUserId) {
  await this.notificationsService.create({
    userId: buyerUserId,
    title: 'Professional contacted your request',
    message: `${updated.professional.user.fullName || 'A professional'} has contacted your real estate request.`,
    type: NotificationType.MATCH,
  });
}
const buyerEmail = updated.lead?.email || updated.buyer?.email;

if (buyerEmail) {
  await this.emailService.sendBuyerContactedEmail({
    buyerEmail,
    buyerName: updated.lead?.fullName || updated.buyer?.fullName,
    professionalName: updated.professional.user.fullName,
    professionalCompany: updated.professional.companyName,
  });
}
if (buyerUserId) {
  const room = await this.prisma.chatRoom.upsert({
    where: {
      matchId: updated.id,
    },
    update: {},
    create: {
      matchId: updated.id,
      buyerId: buyerUserId,
      professionalId: updated.professional.userId,
    },
  });

  const existingMessage = await this.prisma.chatMessage.findFirst({
    where: {
      chatRoomId: room.id,
    },
  });
const introMessage =
  this.messageTemplateService.buildProfessionalIntroMessage({
    buyerName: updated.buyer?.fullName || updated.lead?.fullName,
    professionalName: updated.professional.user.fullName,
    companyName: updated.professional.companyName,
    professionalType: updated.professional.professionalType,
    leadSource: updated.lead?.source,
    leadInterest: updated.lead?.interest,
    leadLocation: updated.lead?.location,
    leadBudget: updated.lead?.budget,
  });
  if (!existingMessage) {
    await this.prisma.chatMessage.create({
      
      data: {
        chatRoomId: room.id,
        senderId: updated.professional.userId,
        content: introMessage,
       },
    });
  }
}

await this.auditService.log({
  userId: user.id,
  userRole: user.role,
  action: 'MATCH_CONTACTED',
  entity: 'Match',
  entityId: updated.id,
  description: `Professional contacted buyer for match ${updated.id}`,
});

return updated;
}

async markAsCompleted(id: string, user: { id: string; role: Role }) {
  const match = await this.prisma.match.findUnique({
    where: { id },
    include: {
      professional: true,
    },
  });

  if (!match) {
    throw new NotFoundException('Match not found');
  }

  if (
    user.role !== Role.ADMIN &&
    (user.role !== Role.PROFESSIONAL || match.professional.userId !== user.id)
  ) {
    throw new ForbiddenException('You cannot update this match');
  }

  if (match.status !== MatchStatus.CONTACTED) {
    throw new ForbiddenException(
      'Only CONTACTED matches can be marked as completed',
    );
  }

  const updated = await this.prisma.match.update({
    where: { id },
    data: {
      status: MatchStatus.COMPLETED,
    },
    include: {
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
      lead: true,
    },
  });

  if (updated.leadId) {
    await this.prisma.lead.update({
      where: { id: updated.leadId },
      data: {
        status: LeadStatus.CLOSED,
      },
    });
  }

  if (updated.buyerId) {
    await this.notificationsService.create({
      userId: updated.buyerId,
      title: 'Match completed',
      message: `Your match with ${
        updated.professional.user.fullName || 'the professional'
      } has been completed.`,
      type: NotificationType.MATCH,
    });
  }
  await this.auditService.log({
  userId: user.id,
  userRole: user.role,
  action: 'MATCH_COMPLETED',
  entity: 'Match',
  entityId: updated.id,
  description: `${
    user.role === Role.ADMIN ? 'Admin' : 'Professional'
  } completed match ${updated.id}`,
});

  return updated;
}


async findByBuyer(userId: string) {
  return this.prisma.match.findMany({
    where: {
      buyerId: userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      review: true,
      lead: true,
      professional: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}
async findByProfessionalUser(userId: string) {
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
      professionalId: profile.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      review: true,
      lead: true,
      professional: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

}