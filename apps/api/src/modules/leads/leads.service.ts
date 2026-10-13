import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  LeadStatus,
  PropertyStatus,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateCalculatorLeadDto } from './dto/create-calculator-lead.dto';
import { CreateNeighborhoodLeadDto } from './dto/create-neighborhood-lead.dto';
import { CreateValuationLeadDto } from './dto/create-valuation-lead.dto';
import { CreatePropertySearchLeadDto } from './dto/create-property-search-lead.dto';
import { CreatePriceCheckerDto } from './dto/create-price-checker.dto';
import { CreateAffordabilityLeadDto } from './dto/create-affordability-lead.dto';
import { CreateTrueCostLeadDto } from './dto/create-true-cost-lead.dto';

import { ProfileScoreService } from '../users/profile-score.service';
import { LeadScoringService } from './lead-scoring.service';
import { AutoMatchingService } from '../matching/auto-matching.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadScoringService: LeadScoringService,
    private readonly profileScoreService: ProfileScoreService,
    private readonly autoMatchingService: AutoMatchingService,
  ) { }

  // ============================================================
  // BASIC LEAD CREATION
  // ============================================================
  private async finalizeBuyerLead(leadId: string) {
    let autoMatching:
      | Awaited<ReturnType<AutoMatchingService['matchLead']>>
      | null = null;

    try {
      autoMatching =
        await this.autoMatchingService.matchLead(leadId);
    } catch (error) {
      this.logger.error(
        `Automatic matching failed for lead ${leadId}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }

    /*
     * AutoMatchingService peut avoir modifié le Lead :
     *
     * NEW
     *   ↓
     * automatic matching
     *   ↓
     * MATCHED si au moins un professionnel compatible existe
     *
     * On recharge donc toujours le Lead depuis la DB.
     */
    const lead = await this.prisma.lead.findUnique({
      where: {
        id: leadId,
      },

      include: {
        matches: {
          orderBy: {
            score: 'desc',
          },

          include: {
            professional: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(
        'Lead not found after automatic matching',
      );
    }

    return {
      ...lead,
      autoMatching,
    };
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role === Role.ADMIN) {
      return this.prisma.lead.findMany({
        orderBy: {
          createdAt: 'desc',
        },

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
        where: {
          userId: user.id,
        },

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          matches: {
            orderBy: {
              score: 'desc',
            },

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

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const lead =
      await this.prisma.lead.findUnique({
        where: {
          id,
        },

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
      throw new NotFoundException(
        'Lead not found',
      );
    }

    if (
      user.role === Role.BUYER &&
      lead.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You can only access your own leads',
      );
    }

    if (
      user.role === Role.PROFESSIONAL
    ) {
      throw new ForbiddenException(
        'Professionals can access leads only through matching',
      );
    }

    return lead;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const lead =
      await this.findOne(
        id,
        user,
      );

    if (
      user.role !== Role.ADMIN &&
      lead.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You cannot update this lead',
      );
    }

    // MATCHED is exclusively managed by the automatic matching engine.
    if (dto.status === LeadStatus.MATCHED) {
      throw new BadRequestException(
        'MATCHED is managed automatically by the smart matching system',
      );
    }

    if (
      lead.status === LeadStatus.MATCHED &&
      dto.status === LeadStatus.NEW
    ) {
      throw new BadRequestException(
        'A matched lead cannot be manually returned to NEW',
      );
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          dto.phone ??
          lead.phone,

        budget:
          dto.budget ??
          lead.budget,

        location:
          dto.location ??
          lead.location,

        interest:
          dto.interest ??
          lead.interest,
      });

    const updatedLead =
      await this.prisma.lead.update({
        where: {
          id,
        },

        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          source: dto.source,
          interest: dto.interest,
          location: dto.location,
          budget: dto.budget,

          quality:
            dto.quality ||
            quality,

          status: dto.status,
        },
      });

    if (updatedLead.userId) {
      await this.profileScoreService.updateUserScore(
        updatedLead.userId,
      );
    }

    return updatedLead;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const lead =
      await this.findOne(
        id,
        user,
      );

    if (
      user.role !== Role.ADMIN &&
      lead.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You cannot delete this lead',
      );
    }

    await this.prisma.lead.delete({
      where: {
        id,
      },
    });

    if (lead.userId) {
      await this.profileScoreService.updateUserScore(
        lead.userId,
      );
    }

    return {
      message:
        'Lead deleted successfully',
    };
  }

  // ============================================================
  // MORTGAGE CALCULATOR
  // ============================================================

  async createFromCalculator(
    dto: CreateCalculatorLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can create calculator requests',
      );
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: user.id },
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
      phone: dto.phone || buyer.phone,
      budget: cleanBudget,
      location: cleanLocation,
      interest: cleanInterest,
    });

    const existingLead = await this.prisma.lead.findFirst({
      where: {
        userId: user.id,
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
      orderBy: { createdAt: 'desc' },
    });

    if (existingLead) {
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead = await this.finalizeBuyerLead(existingLead.id);
        return { ...processedLead, alreadyExists: true };
      }

      return { ...existingLead, alreadyExists: true };
    }

    const lead = await this.prisma.lead.create({
      data: {
        userId: user.id,
        fullName: buyer.fullName || dto.fullName,
        email: buyer.email || cleanEmail,
        phone: buyer.phone || dto.phone,
        source: cleanSource,
        interest: cleanInterest,
        location: cleanLocation,
        budget: cleanBudget,
        quality,
        status: LeadStatus.NEW,
      },
    });

    await this.profileScoreService.updateUserScore(user.id);

    const processedLead = await this.finalizeBuyerLead(lead.id);

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // NEIGHBORHOOD FINDER
  // ============================================================

  async createFromNeighborhoodFinder(
    dto: CreateNeighborhoodLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can create neighborhood requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const neighborhood =
      await this.prisma.neighborhood.findUnique({
        where: {
          id:
            dto.neighborhoodId,
        },
      });

    if (!neighborhood) {
      throw new NotFoundException(
        'Neighborhood not found',
      );
    }

    const budget =
      dto.budgetMin &&
        dto.budgetMax
        ? `€${dto.budgetMin} - €${dto.budgetMax}`
        : dto.budgetMax
          ? `Up to €${dto.budgetMax}`
          : neighborhood.avgPrice
            ? `€${neighborhood.avgPrice}`
            : 'Not specified';

    const interest =
      `Neighborhood Finder / ${dto.goal}`;

    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId:
            user.id,

          source:
            'Neighborhood Finder',

          interest,

          location:
            neighborhood.name,

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
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(existingLead.id);

        return {
          ...processedLead,
          alreadyExists: true,
        };
      }

      return {
        ...existingLead,
        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,

        location:
          neighborhood.name,

        interest,
      });

    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source:
            'Neighborhood Finder',

          interest,

          location:
            neighborhood.name,

          budget,

          quality,

          status:
            LeadStatus.NEW,
        },
      });

    await this.profileScoreService.updateUserScore(
      user.id,
    );

    const processedLead =
      await this.finalizeBuyerLead(lead.id);

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // PROPERTY VALUATION
  // ============================================================

  async createFromPropertyValuation(
    dto: CreateValuationLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can create valuation requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id:
            user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const source =
      'Property Valuation';

    const interest =
      'Property Valuation';

    const location =
      dto.address ||
      'Portugal';

    const budget =
      dto.estimatedValue ||
      dto.askingPrice ||
      'Not specified';

    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId:
            user.id,

          source,
          interest,
          location,
          budget,

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
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(existingLead.id);

        return {
          ...processedLead,
          alreadyExists: true,
        };
      }

      return {
        ...existingLead,
        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,
        location,
        interest,
      });

    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source,
          interest,
          location,
          budget,
          quality,

          status:
            LeadStatus.NEW,
        },
      });

    await this.profileScoreService.updateUserScore(
      user.id,
    );

    const processedLead =
      await this.finalizeBuyerLead(lead.id);

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // PROPERTY SEARCH ASSISTANT
  // ============================================================

  async createFromPropertySearch(
    dto: CreatePropertySearchLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can create property search requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id:
            user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const location =
      dto.location?.trim() ||
      'Portugal';

    const budget =
      dto.budget?.trim() ||
      'Not specified';

    const interest =
      `Property Search / ${dto.goal || 'buy'}`;

   const numericBudget = dto.maxBudget;

if (
  dto.minBudget != null &&
  dto.maxBudget != null &&
  dto.minBudget > dto.maxBudget
) {
  throw new BadRequestException(
    'Minimum budget cannot exceed maximum budget',
  );
}

if (
  dto.minArea != null &&
  dto.maxArea != null &&
  dto.minArea > dto.maxArea
) {
  throw new BadRequestException(
    'Minimum surface cannot exceed maximum surface',
  );
}

    /*
     * ==========================================================
     * STEP 1
     * Load all published properties.
     *
     * We intentionally do not use strict Prisma filters here.
     * The score below determines whether a property is
     * sufficiently relevant.
     * ==========================================================
     */

    const publishedProperties =
      await this.prisma.property.findMany({
        where: {
          status:
            PropertyStatus.PUBLISHED,
        },

        orderBy: [
          {
            featured:
              'desc',
          },
          {
            createdAt:
              'desc',
          },
        ],

        include: {
          professionalProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

    /*
     * ==========================================================
     * STEP 2
     * Score every published property.
     * ==========================================================
     */

    const matchesHardConstraints = (
  property: (typeof publishedProperties)[number],
): boolean => {
  const area = property.area;
  const price = Number(property.price);

  if (
    dto.minArea != null &&
    (area == null || area < dto.minArea)
  ) {
    return false;
  }

  if (
    dto.maxArea != null &&
    (area == null || area > dto.maxArea)
  ) {
    return false;
  }

  if (
    dto.minBudget != null &&
    (!Number.isFinite(price) || price < dto.minBudget)
  ) {
    return false;
  }

  if (
    dto.maxBudget != null &&
    (!Number.isFinite(price) || price > dto.maxBudget)
  ) {
    return false;
  }

  return true;
};

    const scoredProperties =
      publishedProperties
        .map(
          (property) => {
            let score = 0;
            let totalCriteria = 0;

            const matchedCriteria: string[] =
              [];

            const missingCriteria: string[] =
              [];

            // --------------------------------------------------
            // LOCATION
            // --------------------------------------------------

            if (
              dto.location?.trim()
            ) {
              totalCriteria += 1;

              const requestedLocation =
                dto.location
                  .trim()
                  .toLowerCase();

              const locations = [
                property.city,
                property.region,
                property.location,
              ]
                .filter(
                  (
                    value,
                  ): value is string =>
                    Boolean(value),
                )
                .map(
                  (value) =>
                    value
                      .trim()
                      .toLowerCase(),
                );

              const matchesLocation =
                locations.some(
                  (value) =>
                    value.includes(
                      requestedLocation,
                    ) ||
                    requestedLocation.includes(
                      value,
                    ),
                );

              if (
                matchesLocation
              ) {
                score += 1;

                matchedCriteria.push(
                  `Located in ${dto.location}`,
                );
              } else {
                missingCriteria.push(
                  `Preferred location: ${dto.location}`,
                );
              }
            }

            // --------------------------------------------------
            // PROPERTY TYPE
            // --------------------------------------------------

            if (
              dto.propertyType?.trim()
            ) {
              totalCriteria += 1;

              const requestedType =
                dto.propertyType
                  .trim()
                  .toLowerCase();

              const currentType =
                property.propertyType
                  ?.trim()
                  .toLowerCase();

              if (
                currentType ===
                requestedType
              ) {
                score += 1;

                matchedCriteria.push(
                  `Matches property type: ${dto.propertyType}`,
                );
              } else {
                missingCriteria.push(
                  `Requested type: ${dto.propertyType}`,
                );
              }
            }

            // --------------------------------------------------
            // BEDROOMS
            // --------------------------------------------------

            if (
              dto.bedrooms !==
              undefined &&
              dto.bedrooms !==
              null
            ) {
              totalCriteria += 1;

              if (
                property.bedrooms !==
                null &&
                property.bedrooms >=
                dto.bedrooms
              ) {
                score += 1;

                matchedCriteria.push(
                  `${property.bedrooms} bedroom${property.bedrooms >
                    1
                    ? 's'
                    : ''
                  }`,
                );
              } else {
                missingCriteria.push(
                  `Requested at least ${dto.bedrooms} bedroom${dto.bedrooms >
                    1
                    ? 's'
                    : ''
                  }`,
                );
              }
            }

            // --------------------------------------------------
            // BATHROOMS
            // --------------------------------------------------

            if (
              dto.bathrooms !==
              undefined &&
              dto.bathrooms !==
              null
            ) {
              totalCriteria += 1;

              if (
                property.bathrooms !==
                null &&
                property.bathrooms >=
                dto.bathrooms
              ) {
                score += 1;

                matchedCriteria.push(
                  `${property.bathrooms} bathroom${property.bathrooms >
                    1
                    ? 's'
                    : ''
                  }`,
                );
              } else {
                missingCriteria.push(
                  `Requested at least ${dto.bathrooms} bathroom${dto.bathrooms >
                    1
                    ? 's'
                    : ''
                  }`,
                );
              }
            }

            // --------------------------------------------------
            // SURFACE (m²)
            // --------------------------------------------------

            const hasMinArea =
              dto.minArea !== undefined && dto.minArea !== null;

            const hasMaxArea =
              dto.maxArea !== undefined && dto.maxArea !== null;

            if (hasMinArea || hasMaxArea) {
              totalCriteria += 1;

              const propertyArea = property.area;

              const matchesMinArea =
                !hasMinArea ||
                (propertyArea != null && propertyArea >= dto.minArea!);

              const matchesMaxArea =
                !hasMaxArea ||
                (propertyArea != null && propertyArea <= dto.maxArea!);

              if (
                propertyArea != null &&
                matchesMinArea &&
                matchesMaxArea
              ) {
                score += 1;

                matchedCriteria.push(
                  `Surface: ${propertyArea} m² within requested range`,
                );
              } else {
                missingCriteria.push(
                  `Requested surface: ${dto.minArea ?? 0}–${dto.maxArea ?? "unlimited"} m²`,
                );
              }
            }

            // --------------------------------------------------
            // BUDGET
            // --------------------------------------------------

            if (
  dto.minBudget != null ||
  numericBudget != null
) {
  totalCriteria += 1;

  const price = Number(property.price);

  const withinMinBudget =
    dto.minBudget == null ||
    price >= dto.minBudget;

  const withinMaxBudget =
    numericBudget == null ||
    price <= numericBudget;

  if (
    Number.isFinite(price) &&
    withinMinBudget &&
    withinMaxBudget
  ) {
    score += 1;

    matchedCriteria.push(
      `Within budget (€${price.toLocaleString('en-US')})`,
    );
  } else if (
    numericBudget != null &&
    price > numericBudget
  ) {
    missingCriteria.push(
      `€${(price - numericBudget).toLocaleString('en-US')} above budget`,
    );
  } else if (
    dto.minBudget != null &&
    price < dto.minBudget
  ) {
    missingCriteria.push(
      `€${(dto.minBudget - price).toLocaleString('en-US')} below minimum budget`,
    );
  } else {
    missingCriteria.push(
      'Property price is unavailable',
    );
  }
}

            // --------------------------------------------------
            // MUST HAVE
            // --------------------------------------------------

            if (
              dto.mustHave &&
              dto.mustHave.length >
              0
            ) {
              totalCriteria += 1;

              const propertyEquipments =
                property.equipments.map(
                  (
                    equipment,
                  ) =>
                    equipment
                      .trim()
                      .toLowerCase(),
                );

              const matchedMustHave =
                dto.mustHave.filter(
                  (
                    wanted,
                  ) => {
                    const normalizedWanted =
                      wanted
                        .trim()
                        .toLowerCase();

                    return propertyEquipments.some(
                      (
                        equipment,
                      ) =>
                        equipment.includes(
                          normalizedWanted,
                        ) ||
                        normalizedWanted.includes(
                          equipment,
                        ),
                    );
                  },
                );

              const mustHaveRatio =
                matchedMustHave.length /
                dto.mustHave.length;

              /*
               * At least half of the requested special
               * features must be available for this
               * criterion to count as matched.
               */

              if (
                mustHaveRatio >=
                0.5
              ) {
                score += 1;

                matchedCriteria.push(
                  `${matchedMustHave.length}/${dto.mustHave.length} requested features available`,
                );
              } else {
                missingCriteria.push(
                  `Only ${matchedMustHave.length}/${dto.mustHave.length} requested features available`,
                );
              }
            }

            // --------------------------------------------------
            // SCORE
            // --------------------------------------------------

            const matchScore =
              totalCriteria > 0
                ? Math.round(
                  (
                    score /
                    totalCriteria
                  ) *
                  100,
                )
                : 0;

            // --------------------------------------------------
            // RECOMMENDATION
            // --------------------------------------------------

            let recommendation =
              '';

            if (
              matchScore >= 90
            ) {
              recommendation =
                'Excellent match. This property satisfies almost all of your main search criteria.';
            } else if (
              matchScore >= 80
            ) {
              recommendation =
                'Very strong match. This property meets most of your main requirements.';
            } else if (
              matchScore >= 70
            ) {
              recommendation =
                'Good match. This property meets enough of your criteria to be worth considering.';
            } else {
              recommendation =
                'This property does not meet enough of your current search criteria.';
            }

            return {
              ...property,

              matchScore,

              matchedCriteria,

              missingCriteria,

              recommendation,
            };
          },
        )

        /*
         * ======================================================
         * ONLY 70% OR HIGHER
         * ======================================================
         */

        .filter(
  (property) =>
    property.matchScore >= 70 &&
    matchesHardConstraints(property),
)
.sort(
  (a, b) =>
    b.matchScore - a.matchScore,
);

    /*
     * ==========================================================
     * STEP 3
     * At least one strong enough property already exists.
     *
     * No persistent Lead is created in this case.
     * ==========================================================
     */

    if (
      scoredProperties.length >
      0
    ) {
      return {
        found: true,

        properties:
          scoredProperties,

        alreadyExists:
          false,
      };
    }

    /*
     * ==========================================================
     * STEP 4
     * No property >= 70%.
     *
     * Check whether this buyer already has the same
     * persistent search.
     * ==========================================================
     */

    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId:
            user.id,

          source:
            'Property Search Assistant',

          location,

          propertyType:
            dto.propertyType,

          bedrooms:
            dto.bedrooms,

          bathrooms:
            dto.bathrooms,

          maxBudget:
            numericBudget,

          goal:
            dto.goal,

          isActive:
            true,

          status: {
            in: [
              LeadStatus.NEW,
              LeadStatus.MATCHED,
              LeadStatus.CONTACTED,
            ],
          },
        },

        orderBy: {
          createdAt:
            'desc',
        },
      });

    if (existingLead) {
      /*
       * Un ancien Lead encore NEW doit repasser
       * automatiquement dans le moteur de matching.
       *
       * Aucune intervention Admin.
       */
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(
            existingLead.id,
          );

        return {
          found: false,

          lead: processedLead,

          notifiedAgents:
            processedLead.autoMatching?.matched
              ? processedLead.autoMatching.count
              : 0,

          alreadyExists: true,
        };
      }

      /*
       * MATCHED / CONTACTED :
       * il a déjà été traité.
       */
      return {
        found: false,

        lead: existingLead,

        notifiedAgents: 0,

        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,

        location,

        interest,
      });

    /*
     * ==========================================================
     * STEP 5
     * Create persistent buyer search.
     * ==========================================================
     */

    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source:
            'Property Search Assistant',

          interest,

          location,

          budget,

          searchText:
            dto.searchText,

          propertyType:
            dto.propertyType,

          bedrooms:
            dto.bedrooms,

          bathrooms:
            dto.bathrooms,

          minBudget:
            dto.minBudget,

          maxBudget:
            numericBudget,

          goal:
            dto.goal,

          mustHave:
            dto.mustHave ||
            [],

          aiSummary:
            dto.aiSummary,

          confidence:
            dto.confidence,

          /*
           * Persistent search.
           */
          isActive:
            true,

          /*
           * Alerts ON by default.
           */
          notificationsEnabled:
            dto.notificationsEnabled ??
            true,

          quality,

          status:
            LeadStatus.NEW,
        },
      });

    await this.profileScoreService.updateUserScore(
      user.id,
    );

    const processedLead =
      await this.finalizeBuyerLead(lead.id);

    return {
      found: false,

      lead: processedLead,

      notifiedAgents:
        processedLead.autoMatching?.matched
          ? processedLead.autoMatching.count
          : 0,

      alreadyExists: false,
    };
  }

  // ============================================================
  // PRICE CHECKER
  // ============================================================

  async createFromPriceChecker(
    dto: CreatePriceCheckerDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can create price checker requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id:
            user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const location =
      dto.location ||
      'Portugal';

    const budget =
      dto.askingPrice ||
      dto.marketPrice ||
      'Not specified';

    const interest =
      'Price Checker';

    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId:
            user.id,

          source:
            'Price Checker',

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
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(existingLead.id);

        return {
          ...processedLead,
          alreadyExists: true,
        };
      }

      return {
        ...existingLead,
        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,
        location,
        interest,
      });

    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source:
            'Price Checker',

          interest,
          location,
          budget,
          quality,

          status:
            LeadStatus.NEW,
        },
      });

    await this.profileScoreService.updateUserScore(
      user.id,
    );

    const processedLead =
      await this.finalizeBuyerLead(lead.id);

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // AFFORDABILITY CALCULATOR
  // ============================================================

  async createFromAffordabilityCalculator(
    dto: CreateAffordabilityLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role !== Role.BUYER) {
      throw new ForbiddenException(
        'Only buyers can create affordability requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const source =
      'Affordability Calculator';

    const interest =
      'Mortgage / Affordability Review';

    const location =
      'Portugal';

    const budget =
      dto.recommendedBudget ||
      dto.maximumBudget ||
      'Not specified';

    /*
     * Avoid creating the same active
     * affordability request twice.
     */
    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId: user.id,
          source,
          interest,
          budget,

          status: {
            in: [
              LeadStatus.NEW,
              LeadStatus.MATCHED,
              LeadStatus.CONTACTED,
            ],
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    if (existingLead) {
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(existingLead.id);

        return {
          ...processedLead,
          alreadyExists: true,
        };
      }

      return {
        ...existingLead,
        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,
        location,
        interest,
      });

    /*
     * Create the Buyer request.
     */
    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source,
          interest,
          location,
          budget,
          quality,

          status:
            LeadStatus.NEW,
        },
      });

    /*
     * Update Buyer profile score.
     */
    await this.profileScoreService
      .updateUserScore(
        user.id,
      );

    /*
     * ============================================================
     * SMART AUTO MATCHING
     * ============================================================
     *
     * Affordability Calculator
     *       ↓
     * MORTGAGE_BROKER
     *       ↓
     * score >= 70%
     *       ↓
     * Top 3
     *       ↓
     * ACTIVE matches automatically
     */
    const processedLead =
      await this.finalizeBuyerLead(
        lead.id,
      );

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // TRUE COST CALCULATOR
  // ============================================================

  async createFromTrueCostCalculator(
    dto: CreateTrueCostLeadDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can create true cost requests',
      );
    }

    const buyer =
      await this.prisma.user.findUnique({
        where: {
          id:
            user.id,
        },
      });

    if (!buyer) {
      throw new NotFoundException(
        'Buyer not found',
      );
    }

    const source =
      'True Cost Calculator';

    const interest =
      'Portugal Buying Costs / Legal Support';

    const location =
      'Portugal';

    const budget =
      dto.totalCost ||
      dto.propertyPrice ||
      'Not specified';

    const existingLead =
      await this.prisma.lead.findFirst({
        where: {
          userId:
            user.id,

          source,
          interest,
          budget,

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
      if (existingLead.status === LeadStatus.NEW) {
        const processedLead =
          await this.finalizeBuyerLead(existingLead.id);

        return {
          ...processedLead,
          alreadyExists: true,
        };
      }

      return {
        ...existingLead,
        alreadyExists: true,
      };
    }

    const quality =
      this.leadScoringService.calculateQuality({
        phone:
          buyer.phone || '',

        budget,
        location,
        interest,
      });

    const lead =
      await this.prisma.lead.create({
        data: {
          userId:
            user.id,

          fullName:
            buyer.fullName,

          email:
            buyer.email,

          phone:
            buyer.phone,

          source,
          interest,
          location,
          budget,
          quality,

          status:
            LeadStatus.NEW,
        },
      });

    await this.profileScoreService.updateUserScore(
      user.id,
    );

    const processedLead =
      await this.finalizeBuyerLead(lead.id);

    return {
      ...processedLead,
      alreadyExists: false,
    };
  }

  // ============================================================
  // MY LEADS
  // ============================================================

  async findMine(
    userId: string,
  ) {
    return this.prisma.lead.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt:
          'desc',
      },

      include: {
        matches: {
          orderBy: {
            score:
              'desc',
          },

          include: {
            professional: {
              select: {
                id:
                  true,

                professionalType:
                  true,

                companyName:
                  true,

                verificationStatus:
                  true,

                user: {
                  select: {
                    id:
                      true,

                    fullName:
                      true,

                    email:
                      true,

                    avatarUrl:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ============================================================
  // PROPERTY SEARCH ALERT TOGGLE
  // ============================================================

  async updatePropertyAlerts(
    leadId: string,
    enabled: boolean,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.BUYER
    ) {
      throw new ForbiddenException(
        'Only buyers can manage property alerts.',
      );
    }

    const lead =
      await this.prisma.lead.findUnique({
        where: {
          id:
            leadId,
        },
      });

    if (!lead) {
      throw new NotFoundException(
        'Buyer request not found.',
      );
    }

    if (
      lead.userId !==
      user.id
    ) {
      throw new ForbiddenException(
        'You can only update your own property search.',
      );
    }

    if (
      lead.source !==
      'Property Search Assistant' ||
      !lead.searchText
    ) {
      throw new BadRequestException(
        'Property alerts are only available for Property Search Assistant requests.',
      );
    }

    const updatedLead =
      await this.prisma.lead.update({
        where: {
          id:
            leadId,
        },

        data: {
          notificationsEnabled:
            enabled,
        },
      });

    return {
      id:
        updatedLead.id,

      isActive:
        updatedLead.isActive,

      notificationsEnabled:
        updatedLead.notificationsEnabled,
    };
  }
}