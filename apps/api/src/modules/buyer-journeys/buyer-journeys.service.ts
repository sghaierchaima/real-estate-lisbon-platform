import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateBuyerJourneyDto } from './dto/create-buyer-journey.dto';
import { UpdateBuyerJourneyDto } from './dto/update-buyer-journey.dto';

@Injectable()
export class BuyerJourneysService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(buyerId: string, dto: CreateBuyerJourneyDto) {
    const buyer = await this.prisma.user.findUnique({
      where: {
        id: buyerId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    if (buyer.role !== 'BUYER') {
      throw new BadRequestException(
        'Only buyers can start a buyer journey',
      );
    }

    const property = await this.prisma.property.findUnique({
      where: {
        id: dto.propertyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Buyer journey can only be started for a published property',
      );
    }

    // ---------------------------------------------------------
    // Prevent duplicate journey
    // ---------------------------------------------------------

    const existingJourney =
      await this.prisma.buyerJourney.findUnique({
        where: {
          buyerId_propertyId: {
            buyerId,
            propertyId: dto.propertyId,
          },
        },
      });

    if (existingJourney) {
      throw new BadRequestException(
        'A buyer journey already exists for this property',
      );
    }

    return this.prisma.buyerJourney.create({
      data: {
        buyerId,
        propertyId: dto.propertyId,

        goal: dto.goal,
        estimatedBudget: dto.estimatedBudget,
        availableDeposit: dto.availableDeposit,

        financingType: dto.financingType,
        timeline: dto.timeline,

        needsMortgageBroker:
          dto.needsMortgageBroker ?? false,

        needsPropertyLawyer:
          dto.needsPropertyLawyer ?? false,

        needsTaxAdvisor:
          dto.needsTaxAdvisor ?? false,

        needsInsuranceBroker:
          dto.needsInsuranceBroker ?? false,

        notes: dto.notes,

        progress: 10,
        status: 'STARTED',
      },

      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            region: true,
            location: true,
            imageUrls: true,
          },
        },
      },
    });
  }

  // =========================================================
  // GET CURRENT BUYER JOURNEYS
  // =========================================================

  async findMine(buyerId: string) {
    return this.prisma.buyerJourney.findMany({
      where: {
        buyerId,
      },

      orderBy: {
        updatedAt: 'desc',
      },

      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            region: true,
            location: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            imageUrls: true,

            professionalProfile: {
              select: {
                id: true,
                companyName: true,

                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // =========================================================
  // GET ONE
  // =========================================================

  async findMineById(buyerId: string, journeyId: string) {
    const journey =
      await this.prisma.buyerJourney.findFirst({
        where: {
          id: journeyId,
          buyerId,
        },

        include: {
          property: {
            include: {
              professionalProfile: {
                select: {
                  id: true,
                  professionalType: true,
                  companyName: true,
                  rating: true,
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

    if (!journey) {
      throw new NotFoundException('Buyer journey not found');
    }

    return journey;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    buyerId: string,
    journeyId: string,
    dto: UpdateBuyerJourneyDto,
  ) {
    await this.findMineById(buyerId, journeyId);

    return this.prisma.buyerJourney.update({
      where: {
        id: journeyId,
      },

      data: {
        ...dto,
      },

      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            region: true,
            imageUrls: true,
          },
        },
      },
    });
  }

  // =========================================================
  // DELETE / CANCEL
  // =========================================================

  async remove(buyerId: string, journeyId: string) {
    await this.findMineById(buyerId, journeyId);

    await this.prisma.buyerJourney.delete({
      where: {
        id: journeyId,
      },
    });

    return {
      success: true,
      message: 'Buyer journey deleted successfully',
    };
  }
}