import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PropertyStatus,
  Role,
  VerificationStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreatePropertyDto } from './dto/create-property.dto';

import { UpdatePropertyDto } from './dto/update-property.dto';

import { PropertyAlertsService } from '../leads/property-alerts.service';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly propertyAlertsService:
      PropertyAlertsService,
  ) {}

  // ============================================================
  // PROPERTY MANAGEMENT LIST
  // ============================================================

  async findAll(
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (user.role === Role.ADMIN) {
      return this.prisma.property.findMany({
        orderBy: {
          createdAt: 'desc',
        },

        include: {
          professionalProfile: {
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
      });
    }

    if (
      user.role === Role.PROFESSIONAL
    ) {
      const profile =
        await this.getPropertyAgentProfile(
          user.id,
        );

      return this.prisma.property.findMany({
        where: {
          professionalProfileId:
            profile.id,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    throw new ForbiddenException(
      'Buyers cannot access property management',
    );
  }

  // ============================================================
  // PROPERTY MANAGEMENT DETAILS
  // ============================================================

  async findOne(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    const property =
      await this.prisma.property.findUnique({
        where: {
          id,
        },

        include: {
          professionalProfile: {
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
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    if (user.role === Role.BUYER) {
      throw new ForbiddenException(
        'Buyers cannot access property management',
      );
    }

    if (
      user.role ===
        Role.PROFESSIONAL &&
      property.professionalProfile
        .userId !== user.id
    ) {
      throw new ForbiddenException(
        'You can only access your own properties',
      );
    }

    if (
      user.role === Role.PROFESSIONAL
    ) {
      await this.getPropertyAgentProfile(
        user.id,
      );
    }

    return property;
  }

  // ============================================================
  // CREATE PROPERTY
  // ============================================================

  async create(
    dto: CreatePropertyDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    if (
      user.role !== Role.PROFESSIONAL
    ) {
      throw new ForbiddenException(
        'Only active property agents can create properties',
      );
    }

    const profile =
      await this.getPropertyAgentProfile(
        user.id,
      );

    const property =
      await this.prisma.property.create({
        data: {
          professionalProfileId:
            profile.id,

          title:
            dto.title,

          description:
            dto.description,

          location:
            dto.location,

          region:
            dto.region,

          city:
            dto.city,

          price:
            dto.price,

          propertyType:
            dto.propertyType,

          status:
            dto.status ||
            PropertyStatus.DRAFT,

          featured:
            dto.featured ??
            false,

          bedrooms:
            dto.bedrooms,

          bathrooms:
            dto.bathrooms,

          area:
            dto.area,

          landArea:
            dto.landArea,

          constructionYear:
            dto.constructionYear,

          equipments:
            dto.equipments ||
            [],

          imageUrls:
            dto.imageUrls ||
            [],
        },
      });

    /*
     * ==========================================================
     * PROPERTY ALERTS
     *
     * If the Property Agent creates the property directly
     * as PUBLISHED, immediately check all active saved searches.
     * ==========================================================
     */

    if (
      property.status ===
      PropertyStatus.PUBLISHED
    ) {
      await this.propertyAlertsService.checkNewProperty(
        property.id,
      );
    }

    return property;
  }

  // ============================================================
  // UPDATE PROPERTY
  // ============================================================

  async update(
    id: string,
    dto: UpdatePropertyDto,
    user: {
      id: string;
      role: Role;
    },
  ) {
    /*
     * findOne also checks ownership and permissions.
     *
     * We keep the returned property because we need its
     * PREVIOUS status.
     */
    const existingProperty =
      await this.findOne(
        id,
        user,
      );

    const updatedProperty =
      await this.prisma.property.update({
        where: {
          id,
        },

        data: {
          title:
            dto.title,

          description:
            dto.description,

          location:
            dto.location,

          region:
            dto.region,

          city:
            dto.city,

          price:
            dto.price,

          propertyType:
            dto.propertyType,

          status:
            dto.status,

          featured:
            dto.featured,

          bedrooms:
            dto.bedrooms,

          bathrooms:
            dto.bathrooms,

          area:
            dto.area,

          landArea:
            dto.landArea,

          constructionYear:
            dto.constructionYear,

          equipments:
            dto.equipments,

          imageUrls:
            dto.imageUrls,
        },
      });

    /*
     * ==========================================================
     * DETECT A REAL PUBLICATION
     * ==========================================================
     *
     * Examples:
     *
     * DRAFT -> PUBLISHED      ✅ alerts
     * ARCHIVED -> PUBLISHED   ✅ alerts
     * PUBLISHED -> PUBLISHED  ❌ no alerts
     * PUBLISHED -> ARCHIVED   ❌ no alerts
     * DRAFT -> DRAFT          ❌ no alerts
     */

    const becamePublished =
      existingProperty.status !==
        PropertyStatus.PUBLISHED &&
      updatedProperty.status ===
        PropertyStatus.PUBLISHED;

    if (becamePublished) {
      await this.propertyAlertsService.checkNewProperty(
        updatedProperty.id,
      );
    }

    return updatedProperty;
  }

  // ============================================================
  // DELETE PROPERTY
  // ============================================================

  async remove(
    id: string,
    user: {
      id: string;
      role: Role;
    },
  ) {
    await this.findOne(
      id,
      user,
    );

    await this.prisma.property.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Property deleted successfully',
    };
  }

  // ============================================================
  // PROPERTY AGENT SECURITY
  // ============================================================

  private async getPropertyAgentProfile(
    userId: string,
  ) {
    const profile =
      await this.prisma.professionalProfile.findUnique(
        {
          where: {
            userId,
          },
        },
      );

    if (!profile) {
      throw new ForbiddenException(
        'Professional profile not found',
      );
    }

    if (
      profile.professionalType !==
      'PROPERTY_AGENT'
    ) {
      throw new ForbiddenException(
        'Only property agents can access property management',
      );
    }

    if (
      profile.verificationStatus !==
      VerificationStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Professional profile must be active',
      );
    }

    return profile;
  }

  // ============================================================
  // PUBLIC PROPERTIES
  // ============================================================

  async findPublic() {
    return this.prisma.property.findMany({
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
    });
  }

  // ============================================================
  // PUBLIC PROPERTY DETAILS
  // ============================================================

  async findPublicOne(
    id: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id,

          status:
            PropertyStatus.PUBLISHED,
        },

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
                  city: true,
                  country: true,
                },
              },
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }
}