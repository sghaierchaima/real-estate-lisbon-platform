import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        country: true,
        city: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        country: true,
        city: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
    };
  }

  async updateMe(
  id: string,
  dto: {
    fullName?: string;
    phone?: string;
    country?: string;
    city?: string;
    avatarUrl?: string;
  },
) {
  await this.findOne(id);

  return this.prisma.user.update({
    where: { id },
    data: {
      fullName: dto.fullName,
      phone: dto.phone,
      country: dto.country,
      city: dto.city,
      avatarUrl: dto.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      country: true,
      city: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
async updateAvatar(id: string, avatarUrl: string) {
  return this.prisma.user.update({
    where: { id },
    data: {
      avatarUrl,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      country: true,
      city: true,
      avatarUrl: true,
    },
  });
}
async getProfileProgress(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profileCompletion: true,
      profileTier: true,
    },
  });

  return user;
}


async getMyProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      profileCompletion: true,
      profileTier: true,
      leads: {
        select: {
          id: true,
          source: true,
          status: true,
        },
      },
      matchesAsBuyer: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const usedTools = Array.from(
    new Set(user.leads.map((lead) => lead.source).filter(Boolean)),
  );

  const nextSteps: string[] = [];

  if (!user.phone) nextSteps.push('Add your phone number');
  if (!user.country && !user.city) nextSteps.push('Add your country or city');
  if (usedTools.length < 2) nextSteps.push('Use one more buyer tool');
  if (!user.matchesAsBuyer.length) nextSteps.push('Request professional matching');
const journey = {
  accountCreated: true,

  profileCompleted: user.profileCompletion >= 60,

  firstToolCompleted: usedTools.length >= 1,

  matchedWithProfessional:
    user.matchesAsBuyer.length > 0,

  contactedProfessional: user.matchesAsBuyer.some(
    (match) =>
      match.status === MatchStatus.CONTACTED ||
      match.status === MatchStatus.COMPLETED,
  ),

  completedJourney: user.matchesAsBuyer.some(
    (match) => match.status === MatchStatus.COMPLETED,
  ),
};
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    city: user.city,
    
    profileCompletion: user.profileCompletion,
    profileTier: user.profileTier,
    usedTools,
    totalRequests: user.leads.length,
    totalMatches: user.matchesAsBuyer.length,
    nextSteps,
    journey,
  };
} 
}