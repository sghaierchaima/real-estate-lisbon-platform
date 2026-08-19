import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  LeadStatus,
  MatchStatus,
  NotificationType,
  Prisma,
  VerificationStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  NotificationsService,
} from '../notifications/notifications.service';

import {
  MatchingEngineService,
} from './matching-engine.service';
type AutoMatchResult =
  Prisma.MatchGetPayload<{
    include: {
      professional: {
        include: {
          user: true;
        };
      };
      lead: true;
    };
  }>;
  
@Injectable()
export class AutoMatchingService {
  private readonly logger =
    new Logger(AutoMatchingService.name);

  private readonly threshold = 70;
  private readonly maximumMatches = 3;

  constructor(
    private readonly prisma: PrismaService,

    private readonly matchingEngine:
      MatchingEngineService,

    private readonly notificationsService:
      NotificationsService,
  ) {}

  async matchLead(leadId: string) {
    const lead =
      await this.prisma.lead.findUnique({
        where: {
          id: leadId,
        },
      });

    if (!lead) {
      return {
        matched: false,
        reason: 'LEAD_NOT_FOUND',
        matches: [],
      };
    }

    if (!lead.userId) {
      return {
        matched: false,
        reason: 'LEAD_HAS_NO_BUYER',
        matches: [],
      };
    }

    /*
     * 1. Determine which professional
     * category is appropriate.
     */
    const requiredType =
      this.matchingEngine.detectProfessionalType(
        `${lead.source || ''} ${lead.interest || ''}`,
      );

    /*
     * 2. Only ACTIVE professionals of
     * the correct category are considered.
     */
    const professionals =
      await this.prisma.professionalProfile.findMany({
        where: {
          professionalType:
            requiredType,

          verificationStatus:
            VerificationStatus.ACTIVE,
        },

        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              city: true,
              country: true,
              avatarUrl: true,
            },
          },
        },
      });

    if (professionals.length === 0) {
      return {
        matched: false,
        reason:
          'NO_ELIGIBLE_PROFESSIONAL',
        professionalType:
          requiredType,
        matches: [],
      };
    }

    /*
     * 3. Calculate all scores.
     */
    const candidates =
      professionals
        .map((professional) => {
          const result =
            this.matchingEngine.calculateDetailedScore(
              lead,
              professional,
            );

          return {
            professional,
            score: result.score,
            reasons: result.reasons,
          };
        })

        /*
         * 4. >= 70 only.
         */
        .filter(
          (candidate) =>
            candidate.score >=
            this.threshold,
        )

        /*
         * 5. Best first.
         */
        .sort(
          (a, b) =>
            b.score - a.score,
        )

        /*
         * 6. Maximum Top 3.
         */
        .slice(
          0,
          this.maximumMatches,
        );

    if (candidates.length === 0) {
      return {
        matched: false,
        reason:
          'NO_CANDIDATE_ABOVE_THRESHOLD',
        professionalType:
          requiredType,
        threshold:
          this.threshold,
        matches: [],
      };
    }

    const matches: AutoMatchResult[] = [];

    for (const candidate of candidates) {
      try {
        const match =
          await this.prisma.match.upsert({
            where: {
              leadId_professionalId: {
                leadId:
                  lead.id,

                professionalId:
                  candidate.professional.id,
              },
            },

            update: {
              score:
                candidate.score,

              /*
               * Important:
               * no Admin approval.
               */
              status:
                MatchStatus.ACTIVE,
            },

            create: {
              buyerId:
                lead.userId,

              leadId:
                lead.id,

              professionalId:
                candidate.professional.id,

              score:
                candidate.score,

              status:
                MatchStatus.ACTIVE,
            },

            include: {
              professional: {
                include: {
                  user: true,
                },
              },

              lead: true,
            },
          });

        matches.push(match);

        /*
         * Notify professional.
         */
        await this.notificationsService.create({
          userId:
            candidate.professional.userId,

          type:
            NotificationType.MATCH,

          title:
            'New buyer match',

          message:
            `A new buyer request matches your profile at ${candidate.score}%.`,
        });
      } catch (error) {
        this.logger.error(
          `Auto matching failed for lead ${lead.id} and professional ${candidate.professional.id}`,
          error instanceof Error
            ? error.stack
            : String(error),
        );
      }
    }

    if (matches.length === 0) {
      return {
        matched: false,
        reason:
          'MATCH_CREATION_FAILED',
        matches: [],
      };
    }

    /*
     * Lead becomes MATCHED automatically.
     */
    await this.prisma.lead.update({
      where: {
        id: lead.id,
      },

      data: {
        status:
          LeadStatus.MATCHED,
      },
    });

    /*
     * Buyer notification.
     */
    await this.notificationsService.create({
      userId:
        lead.userId,

      type:
        NotificationType.MATCH,

      title:
        'Professionals matched to your request',

      message:
        `${matches.length} verified professional${
          matches.length > 1
            ? 's have'
            : ' has'
        } been automatically matched to your request.`,
    });

    return {
      matched: true,

      professionalType:
        requiredType,

      threshold:
        this.threshold,

      count:
        matches.length,

      matches,
    };
  }
}