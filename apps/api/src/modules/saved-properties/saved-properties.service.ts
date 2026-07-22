import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PropertyStatus,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

type AuthenticatedUser = {
  id: string;
  role: Role;
};

@Injectable()
export class SavedPropertiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(user: AuthenticatedUser) {
    const savedProperties =
      await this.prisma.savedProperty.findMany({
        where: {
          userId: user.id,
        },

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          property: {
            include: {
              professionalProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      avatarUrl: true,
                      phone: true,
                      city: true,
                      country: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    return savedProperties;
  }

  async getSavedIds(user: AuthenticatedUser) {
    const savedProperties =
      await this.prisma.savedProperty.findMany({
        where: {
          userId: user.id,
        },

        select: {
          propertyId: true,
        },
      });

    return {
      propertyIds: savedProperties.map(
        (item) => item.propertyId,
      ),
    };
  }

  async isSaved(
    propertyId: string,
    user: AuthenticatedUser,
  ) {
    const savedProperty =
      await this.prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },

        select: {
          id: true,
        },
      });

    return {
      isSaved: Boolean(savedProperty),
    };
  }

  async save(
    propertyId: string,
    user: AuthenticatedUser,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          status: PropertyStatus.PUBLISHED,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Published property not found',
      );
    }

    const existing =
      await this.prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    if (existing) {
      return {
        message: 'Property already saved',
        savedProperty: existing,
      };
    }

    const savedProperty =
      await this.prisma.savedProperty.create({
        data: {
          userId: user.id,
          propertyId,
        },
      });

    return {
      message: 'Property saved successfully',
      savedProperty,
    };
  }

  async remove(
    propertyId: string,
    user: AuthenticatedUser,
  ) {
    const savedProperty =
      await this.prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    if (!savedProperty) {
      throw new NotFoundException(
        'Saved property not found',
      );
    }

    await this.prisma.savedProperty.delete({
      where: {
        id: savedProperty.id,
      },
    });

    return {
      message:
        'Property removed from saved properties',
    };
  }

  async toggle(
    propertyId: string,
    user: AuthenticatedUser,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          status: PropertyStatus.PUBLISHED,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Published property not found',
      );
    }

    const existing =
      await this.prisma.savedProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

    if (existing) {
      await this.prisma.savedProperty.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        isSaved: false,
        message:
          'Property removed from saved properties',
      };
    }

    await this.prisma.savedProperty.create({
      data: {
        userId: user.id,
        propertyId,
      },
    });

    return {
      isSaved: true,
      message: 'Property saved successfully',
    };
  }
  async count(user: AuthenticatedUser) {
  const count =
    await this.prisma.savedProperty.count({
      where: {
        userId: user.id,
      },
    });

  return {
    count,
  };
}
}