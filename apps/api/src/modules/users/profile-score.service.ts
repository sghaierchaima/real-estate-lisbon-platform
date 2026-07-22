import { Injectable } from '@nestjs/common';
import { LeadStatus, MatchStatus, ProfileTier } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProfileScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserScore(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        leads: true,
        matchesAsBuyer: true,
      },
    });

    if (!user) return null;

    let score = 20; // Registered base score

    if (user.phone) score += 10;
    if (user.country || user.city) score += 10;

    const activeLeads = user.leads.filter(
      (lead) => lead.status !== LeadStatus.LOST,
    );

    if (activeLeads.length >= 1) score += 15;

    const uniqueToolsUsed = new Set(
      activeLeads
        .map((lead) => lead.source)
        .filter((source): source is string => Boolean(source)),
    );

    if (uniqueToolsUsed.size >= 2) score += 15;
    if (uniqueToolsUsed.size >= 4) score += 10;

    const hasMatchedLead = activeLeads.some(
      (lead) =>
        lead.status === LeadStatus.MATCHED ||
        lead.status === LeadStatus.CONTACTED,
    );

    if (hasMatchedLead) score += 15;

    const hasCompletedMatch = user.matchesAsBuyer.some(
      (match) => match.status === MatchStatus.COMPLETED,
    );

    if (hasCompletedMatch) score += 15;

    score = Math.min(score, 100);

    const tier = this.getProfileTier(score);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileCompletion: score,
        profileTier: tier,
      },
    });

    return updatedUser;
  }

  private getProfileTier(score: number): ProfileTier {
    if (score >= 90) return ProfileTier.PRIORITY;
    if (score >= 80) return ProfileTier.QUALIFIED;
    if (score >= 60) return ProfileTier.ACTIVE_BUYER;
    if (score >= 40) return ProfileTier.EXPLORER;
    return ProfileTier.REGISTERED;
  }
}