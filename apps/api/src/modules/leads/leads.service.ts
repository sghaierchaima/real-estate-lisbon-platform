import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadQuality, LeadStatus, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateCalculatorLeadDto } from './dto/create-calculator-lead.dto';
import { ProfileScoreService } from '../users/profile-score.service';
import { LeadScoringService } from './lead-scoring.service';
import { CreateNeighborhoodLeadDto } from './dto/create-neighborhood-lead.dto';
import { CreateValuationLeadDto } from './dto/create-valuation-lead.dto';
import { CreatePropertySearchLeadDto } from './dto/create-property-search-lead.dto';
import { CreatePriceCheckerDto } from './dto/create-price-checker.dto';
import { CreateAffordabilityLeadDto } from './dto/create-affordability-lead.dto'; 
import { CreateTrueCostLeadDto } from './dto/create-true-cost-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadScoringService: LeadScoringService,
    private readonly profileScoreService: ProfileScoreService,
  ) {}

  async create(dto: CreateLeadDto, user: { id: string; role: Role }) {
    const quality = this.leadScoringService.calculateQuality({
      phone: dto.phone,
      budget: dto.budget,
      location: dto.location,
      interest: dto.interest,
    });

    const lead = await this.prisma.lead.create({
      data: {
        userId: user.id,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        interest: dto.interest,
        location: dto.location,
        budget: dto.budget,
        quality: dto.quality || quality,
        status: dto.status || LeadStatus.NEW,
      },
    });

    await this.profileScoreService.updateUserScore(user.id);

    return lead;
  }

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          matches: true,
        },
      });
    }

    if (user.role === Role.BUYER) {
      return this.prisma.lead.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' },
  include: {
    matches: {
      orderBy: { score: 'desc' },
      include: {
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
      },
    },
  },
});
    }

    throw new ForbiddenException(
      'Professionals cannot access all leads directly',
    );
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        matches: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (user.role === Role.BUYER && lead.userId !== user.id) {
      throw new ForbiddenException('You can only access your own leads');
    }

    if (user.role === Role.PROFESSIONAL) {
      throw new ForbiddenException(
        'Professionals can access leads only through matching',
      );
    }

    return lead;
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    user: { id: string; role: Role },
  ) {
    const lead = await this.findOne(id, user);

    if (user.role !== Role.ADMIN && lead.userId !== user.id) {
      throw new ForbiddenException('You cannot update this lead');
    }

    const quality = this.leadScoringService.calculateQuality({
      phone: dto.phone ?? lead.phone,
      budget: dto.budget ?? lead.budget,
      location: dto.location ?? lead.location,
      interest: dto.interest ?? lead.interest,
    });

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        interest: dto.interest,
        location: dto.location,
        budget: dto.budget,
        quality: dto.quality || quality,
        status: dto.status,
      },
    });

    if (updatedLead.userId) {
      await this.profileScoreService.updateUserScore(updatedLead.userId);
    }

    return updatedLead;
  }

  async remove(id: string, user: { id: string; role: Role }) {
    const lead = await this.findOne(id, user);

    if (user.role !== Role.ADMIN && lead.userId !== user.id) {
      throw new ForbiddenException('You cannot delete this lead');
    }

    await this.prisma.lead.delete({
      where: { id },
    });

    if (lead.userId) {
      await this.profileScoreService.updateUserScore(lead.userId);
    }

    return {
      message: 'Lead deleted successfully',
    };
  }

 async createFromCalculator(
  dto: CreateCalculatorLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException(
      'Only buyers can create calculator requests',
    );
  }

  const buyer = await this.prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }
  const cleanEmail = dto.email.trim().toLowerCase();
  const cleanSource = dto.source || 'Mortgage Calculator';
  const cleanInterest = dto.interest || 'Mortgage / Property Purchase';
  const cleanLocation = dto.location || 'Portugal';
  const cleanBudget = dto.budget;

  const quality = this.leadScoringService.calculateQuality({
    phone: dto.phone,
    budget: cleanBudget,
    location: cleanLocation,
    interest: cleanInterest,
  });

  const existingUser = await this.prisma.user.findUnique({
    where: {
      email: cleanEmail,
    },
  });

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      email: cleanEmail,
      source: cleanSource,
      interest: cleanInterest,
      budget: cleanBudget,
      status: {
        in: [
          LeadStatus.NEW,
          LeadStatus.CONTACTED,
          LeadStatus.MATCHED,
        ],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existingLead) {
    if (existingUser && !existingLead.userId) {
      const linkedLead = await this.prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          userId: existingUser.id,
          fullName: existingLead.fullName || dto.fullName,
          phone: existingLead.phone || dto.phone,
        },
      });

      await this.profileScoreService.updateUserScore(existingUser.id);

      return linkedLead;
    }

    return {
  ...existingLead,
  alreadyExists: true,
};
  }

  const lead = await this.prisma.lead.create({
    data: {
      userId: existingUser?.id || null,
      fullName: dto.fullName,
      email: cleanEmail,
      phone: dto.phone,
      source: cleanSource,
      interest: cleanInterest,
      location: cleanLocation,
      budget: cleanBudget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  if (existingUser) {
    await this.profileScoreService.updateUserScore(existingUser.id);
  }

  return {
  ...lead,
  alreadyExists: false,
};
}
async createFromNeighborhoodFinder(
  dto: CreateNeighborhoodLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException('Only buyers can create neighborhood requests');
  }

  const buyer = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const neighborhood = await this.prisma.neighborhood.findUnique({
    where: { id: dto.neighborhoodId },
  });

  if (!neighborhood) {
    throw new NotFoundException('Neighborhood not found');
  }

  const budget =
    dto.budgetMin && dto.budgetMax
      ? `€${dto.budgetMin} - €${dto.budgetMax}`
      : dto.budgetMax
        ? `Up to €${dto.budgetMax}`
        : neighborhood.avgPrice
          ? `€${neighborhood.avgPrice}`
          : 'Not specified';

  const interest = `Neighborhood Finder / ${dto.goal}`;

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source: 'Neighborhood Finder',
      interest,
      location: neighborhood.name,
      status: {
        in: [LeadStatus.NEW, LeadStatus.MATCHED, LeadStatus.CONTACTED],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location: neighborhood.name,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      source: 'Neighborhood Finder',
      interest,
      location: neighborhood.name,
      budget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}

async createFromPropertyValuation(
  dto: CreateValuationLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException('Only buyers can create valuation requests');
  }

  const buyer = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const source = 'Property Valuation';
  const interest = 'Property Valuation';
  const location = dto.address || 'Portugal';
  const budget = dto.estimatedValue || dto.askingPrice || 'Not specified';

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source,
      interest,
      location,
      budget,
      status: {
        in: [LeadStatus.NEW, LeadStatus.MATCHED, LeadStatus.CONTACTED],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      source,
      interest,
      location,
      budget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}

async createFromPropertySearch(
  dto: CreatePropertySearchLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException('Only buyers can create property search requests');
  }

  const buyer = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const location = dto.location || 'Portugal';
  const budget = dto.budget || 'Not specified';
  const interest = `Property Search / ${dto.goal || 'buy'}`;

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source: 'Property Search Assistant',
      interest,
      location,
      status: {
        in: [LeadStatus.NEW, LeadStatus.MATCHED, LeadStatus.CONTACTED],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      source: 'Property Search Assistant',
      interest,
      location,
      budget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}


async createFromPriceChecker(
  dto: CreatePriceCheckerDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException(
      'Only buyers can create price checker requests',
    );
  }

  const buyer = await this.prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const location = dto.location || 'Portugal';

  const budget = dto.askingPrice || dto.marketPrice || 'Not specified';

  const interest = 'Price Checker';

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source: 'Price Checker',
      interest,
      location,
      status: {
        in: [
          LeadStatus.NEW,
          LeadStatus.MATCHED,
          LeadStatus.CONTACTED,
        ],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,

      source: 'Price Checker',

      interest,

      location,

      budget,

      quality,

      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}


async createFromAffordabilityCalculator(
  dto: CreateAffordabilityLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException(
      'Only buyers can create affordability requests',
    );
  }

  const buyer = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const source = 'Affordability Calculator';
  const interest = 'Mortgage / Affordability Review';
  const location = 'Portugal';
  const budget = dto.recommendedBudget || dto.maximumBudget || 'Not specified';

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source,
      interest,
      budget,
      status: {
        in: [LeadStatus.NEW, LeadStatus.MATCHED, LeadStatus.CONTACTED],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      source,
      interest,
      location,
      budget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}



async createFromTrueCostCalculator(
  dto: CreateTrueCostLeadDto,
  user: { id: string; role: Role },
) {
  if (user.role !== Role.BUYER) {
    throw new ForbiddenException(
      'Only buyers can create true cost requests',
    );
  }

  const buyer = await this.prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const source = 'True Cost Calculator';
  const interest = 'Portugal Buying Costs / Legal Support';
  const location = 'Portugal';
  const budget = dto.totalCost || dto.propertyPrice || 'Not specified';

  const existingLead = await this.prisma.lead.findFirst({
    where: {
      userId: user.id,
      source,
      interest,
      budget,
      status: {
        in: [LeadStatus.NEW, LeadStatus.MATCHED, LeadStatus.CONTACTED],
      },
    },
  });

  if (existingLead) {
    return {
      ...existingLead,
      alreadyExists: true,
    };
  }

  const quality = this.leadScoringService.calculateQuality({
    phone: buyer.phone || '',
    budget,
    location,
    interest,
  });

  const lead = await this.prisma.lead.create({
    data: {
      userId: user.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      source,
      interest,
      location,
      budget,
      quality,
      status: LeadStatus.NEW,
    },
  });

  await this.profileScoreService.updateUserScore(user.id);

  return {
    ...lead,
    alreadyExists: false,
  };
}
async findMine(userId: string) {
  return this.prisma.lead.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      matches: {
        include: {
          professional: {
            select: {
              id: true,
              professionalType: true,
              companyName: true,
              verificationStatus: true,
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
      },
    },
  });
}

}