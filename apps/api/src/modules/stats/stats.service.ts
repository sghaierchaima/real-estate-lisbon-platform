import { Injectable } from '@nestjs/common';
import { LeadQuality, MatchStatus, Role, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
  const [
    totalUsers,
    totalBuyers,
    totalProfessionals,
    totalProperties,

    totalLeads,
    matchedLeads,
    hotLeads,

    totalMatches,
    pendingMatches,
    activeMatches,
    contactedMatches,
    completedMatches,
    cancelledMatches,

    pendingStories,
    approvedStories,
  ] = await Promise.all([
    // Users
    this.prisma.user.count(),

    this.prisma.user.count({
      where: {
        role: Role.BUYER,
      },
    }),

    this.prisma.professionalProfile.count(),

    // Properties
    this.prisma.property.count(),

    // Leads
    this.prisma.lead.count(),

    this.prisma.lead.count({
      where: {
        matches: {
          some: {},
        },
      },
    }),

    this.prisma.lead.count({
      where: {
        quality: LeadQuality.HOT,
      },
    }),

    // Matches
    this.prisma.match.count(),

    this.prisma.match.count({
      where: {
        status: MatchStatus.PENDING,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.ACTIVE,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.CONTACTED,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.COMPLETED,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.CANCELLED,
      },
    }),

    // Stories
    this.prisma.story.count({
      where: {
        status: StoryStatus.PENDING,
      },
    }),

    this.prisma.story.count({
      where: {
        status: StoryStatus.APPROVED,
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      buyers: totalBuyers,
      professionals: totalProfessionals,
    },

    properties: {
      total: totalProperties,
    },

    leads: {
      total: totalLeads,
      matched: matchedLeads,
      hot: hotLeads,
    },

    matching: {
      total: totalMatches,
      pending: pendingMatches,
      active: activeMatches,
      contacted: contactedMatches,
      completed: completedMatches,
      cancelled: cancelledMatches,
    },

    stories: {
      pending: pendingStories,
      approved: approvedStories,
    },
  };
}
  async getRecentActivity() {
  const [latestLeads, latestMatches, latestProperties] = await Promise.all([
    this.prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        source: true,
        interest: true,
        createdAt: true,
      },
    }),

    this.prisma.match.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        score: true,
        createdAt: true,
        lead: {
          select: {
            fullName: true,
            email: true,
          },
        },
        professional: {
          select: {
            companyName: true,
            professionalType: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    }),

    this.prisma.property.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        createdAt: true,
      },
    }),
  ]);

  const activities = [
    ...latestLeads.map((lead) => ({
      id: `lead-${lead.id}`,
      type: 'LEAD',
      title: lead.fullName || lead.email || 'New lead',
      description: `Created from ${lead.source || lead.interest || 'platform'}`,
      createdAt: lead.createdAt,
    })),

    ...latestMatches.map((match) => ({
      id: `match-${match.id}`,
      type: 'MATCH',
      title: match.lead?.fullName || match.lead?.email || 'New match',
      description: `Matched with ${
        match.professional.user.fullName ||
        match.professional.companyName ||
        match.professional.professionalType
      } • ${match.status}`,
      createdAt: match.createdAt,
    })),

    ...latestProperties.map((property) => ({
      id: `property-${property.id}`,
      type: 'PROPERTY',
      title: property.title,
      description: `Property ${property.status.toLowerCase()}${
        property.city ? ` in ${property.city}` : ''
      }`,
      createdAt: property.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);
}
async getProfessionalDashboardStats(user: { id: string; role: Role }) {
  const profile = await this.prisma.professionalProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return {
      profile: null,
      matches: {
        total: 0,
        pending: 0,
        active: 0,
        contacted: 0,
        completed: 0,
        cancelled: 0,
      },
      properties: {
        total: 0,
        published: 0,
        draft: 0,
      },
      notifications: {
        unread: 0,
      },
    };
  }

  const [
    totalMatches,
    pendingMatches,
    activeMatches,
    contactedMatches,
    completedMatches,
    cancelledMatches,
    totalProperties,
    publishedProperties,
    draftProperties,
    unreadNotifications,
  ] = await Promise.all([
    this.prisma.match.count({ where: { professionalId: profile.id } }),
    this.prisma.match.count({
      where: { professionalId: profile.id, status: MatchStatus.PENDING },
    }),
    this.prisma.match.count({
      where: { professionalId: profile.id, status: MatchStatus.ACTIVE },
    }),
    this.prisma.match.count({
      where: { professionalId: profile.id, status: MatchStatus.CONTACTED },
    }),
    this.prisma.match.count({
      where: { professionalId: profile.id, status: MatchStatus.COMPLETED },
    }),
    this.prisma.match.count({
      where: { professionalId: profile.id, status: MatchStatus.CANCELLED },
    }),
    this.prisma.property.count({
      where: { professionalProfileId: profile.id },
    }),
    this.prisma.property.count({
      where: { professionalProfileId: profile.id, status: 'PUBLISHED' },
    }),
    this.prisma.property.count({
      where: { professionalProfileId: profile.id, status: 'DRAFT' },
    }),
    this.prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return {
    profile: {
      id: profile.id,
      professionalType: profile.professionalType,
      verificationStatus: profile.verificationStatus,
      profileCompletion: profile.profileCompletion,
      isPropertyAgent: profile.professionalType === 'PROPERTY_AGENT',
    },
    matches: {
      total: totalMatches,
      pending: pendingMatches,
      active: activeMatches,
      contacted: contactedMatches,
      completed: completedMatches,
      cancelled: cancelledMatches,
    },
    properties: {
      total: totalProperties,
      published: publishedProperties,
      draft: draftProperties,
    },
    notifications: {
      unread: unreadNotifications,
    },
  };
}

async getBuyerDashboardStats(user: { id: string; role: Role }) {
  const [
    totalLeads,
    hotLeads,
    totalMatches,
    pendingMatches,
    activeMatches,
    contactedMatches,
    completedMatches,
    unreadNotifications,
  ] = await Promise.all([
    this.prisma.lead.count({ where: { userId: user.id } }),
    this.prisma.lead.count({
      where: { userId: user.id, quality: LeadQuality.HOT },
    }),
    this.prisma.match.count({ where: { buyerId: user.id } }),
    this.prisma.match.count({
      where: { buyerId: user.id, status: MatchStatus.PENDING },
    }),
    this.prisma.match.count({
      where: { buyerId: user.id, status: MatchStatus.ACTIVE },
    }),
    this.prisma.match.count({
      where: { buyerId: user.id, status: MatchStatus.CONTACTED },
    }),
    this.prisma.match.count({
      where: { buyerId: user.id, status: MatchStatus.COMPLETED },
    }),
    this.prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return {
    leads: {
      total: totalLeads,
      hot: hotLeads,
    },
    matches: {
      total: totalMatches,
      pending: pendingMatches,
      active: activeMatches,
      contacted: contactedMatches,
      completed: completedMatches,
    },
    notifications: {
      unread: unreadNotifications,
    },
  };
}

async getAnalyticsDashboard() {
  const [
    totalLeads,
    matchedLeadsCount,

    totalMatches,
    completedMatches,
    contactedMatches,
    activeMatches,
    pendingMatches,
    cancelledMatches,

    hotLeads,
    warmLeads,
    coldLeads,

    totalProfessionals,
    activeProfessionals,

    leads,
    matches,
    professionals,
  ] = await Promise.all([
    // Leads
    this.prisma.lead.count(),

    this.prisma.lead.count({
      where: {
        matches: {
          some: {},
        },
      },
    }),

    // Matches
    this.prisma.match.count(),

    this.prisma.match.count({
      where: {
        status: MatchStatus.COMPLETED,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.CONTACTED,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.ACTIVE,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.PENDING,
      },
    }),

    this.prisma.match.count({
      where: {
        status: MatchStatus.CANCELLED,
      },
    }),

    // Lead quality
    this.prisma.lead.count({
      where: {
        quality: LeadQuality.HOT,
      },
    }),

    this.prisma.lead.count({
      where: {
        quality: LeadQuality.WARM,
      },
    }),

    this.prisma.lead.count({
      where: {
        quality: LeadQuality.COLD,
      },
    }),

    // Professionals
    this.prisma.professionalProfile.count(),

    this.prisma.professionalProfile.count({
      where: {
        verificationStatus: 'ACTIVE',
      },
    }),

    // Lead details
    this.prisma.lead.findMany({
      select: {
        id: true,
        source: true,
        quality: true,
        status: true,
        createdAt: true,
      },
    }),

    // Match details
    this.prisma.match.findMany({
      select: {
        id: true,
        status: true,
        score: true,
        createdAt: true,
        professional: {
          select: {
            id: true,
            companyName: true,
            professionalType: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    }),

    // Top professionals
    this.prisma.professionalProfile.findMany({
      take: 5,

      orderBy: [
        {
          rating: 'desc',
        },
        {
          profileCompletion: 'desc',
        },
      ],

      select: {
        id: true,
        companyName: true,
        professionalType: true,
        rating: true,
        verificationStatus: true,

        user: {
          select: {
            fullName: true,
          },
        },

        matches: {
          where: {
            status: MatchStatus.COMPLETED,
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  const leadsBySource = Object.values(
    leads.reduce<
      Record<
        string,
        {
          source: string;
          total: number;
        }
      >
    >((accumulator, lead) => {
      const source = lead.source?.trim() || 'Unknown';

      if (!accumulator[source]) {
        accumulator[source] = {
          source,
          total: 0,
        };
      }

      accumulator[source].total += 1;

      return accumulator;
    }, {}),
  ).sort((first, second) => second.total - first.total);

  const matchesByStatus = Object.values(
    matches.reduce<
      Record<
        string,
        {
          status: string;
          total: number;
        }
      >
    >((accumulator, match) => {
      const status = match.status;

      if (!accumulator[status]) {
        accumulator[status] = {
          status,
          total: 0,
        };
      }

      accumulator[status].total += 1;

      return accumulator;
    }, {}),
  ).sort((first, second) => second.total - first.total);

  const averageMatchScore =
    matches.length === 0
      ? 0
      : Math.round(
          matches.reduce(
            (total, match) => total + match.score,
            0,
          ) / matches.length,
        );

  const conversionRate =
    totalLeads === 0
      ? 0
      : Math.round(
          (matchedLeadsCount / totalLeads) * 100,
        );

  const completionRate =
    totalMatches === 0
      ? 0
      : Math.round(
          (completedMatches / totalMatches) * 100,
        );

  return {
    totals: {
      leads: totalLeads,
      matchedLeads: matchedLeadsCount,
      matches: totalMatches,

      professionals: totalProfessionals,
      activeProfessionals,

      averageMatchScore,
      conversionRate,
      completionRate,
    },

    leadsQuality: {
      hot: hotLeads,
      warm: warmLeads,
      cold: coldLeads,
    },

    matchesStatus: {
      pending: pendingMatches,
      active: activeMatches,
      contacted: contactedMatches,
      completed: completedMatches,
      cancelled: cancelledMatches,
    },

    leadsBySource,
    matchesByStatus,

    topProfessionals: professionals.map(
      (professional) => ({
        id: professional.id,

        name:
          professional.user.fullName ||
          professional.companyName ||
          'Unnamed professional',

        companyName: professional.companyName,
        professionalType: professional.professionalType,
        rating: professional.rating,

        completedMatches:
          professional.matches.length,

        verificationStatus:
          professional.verificationStatus,
      }),
    ),
  };
}
}