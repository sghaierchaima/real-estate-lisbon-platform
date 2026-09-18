import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  PropertyStatus,
  Role,
  VerificationStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  PropertyAlertsService,
} from '../leads/property-alerts.service';

import {
  PropertiesService,
} from './properties.service';

import {
  CreatePropertyDto,
} from './dto/create-property.dto';

import {
  UpdatePropertyDto,
} from './dto/update-property.dto';

describe(
  'PropertiesService',
  () => {
    let service:
      PropertiesService;

    let prisma: {
      property: {
        findMany:
          jest.Mock;

        findUnique:
          jest.Mock;

        findFirst:
          jest.Mock;

        create:
          jest.Mock;

        update:
          jest.Mock;

        delete:
          jest.Mock;
      };

      professionalProfile: {
        findUnique:
          jest.Mock;
      };
    };

    let propertyAlertsService: {
      checkNewProperty:
        jest.Mock;
    };

    const adminUser = {
      id:
        'admin-1',

      role:
        Role.ADMIN,
    };

    const buyerUser = {
      id:
        'buyer-1',

      role:
        Role.BUYER,
    };

    const professionalUser = {
      id:
        'professional-user-1',

      role:
        Role.PROFESSIONAL,
    };

    const activeAgentProfile = {
      id:
        'profile-1',

      userId:
        'professional-user-1',

      professionalType:
        'PROPERTY_AGENT',

      verificationStatus:
        VerificationStatus.ACTIVE,
    };

    const baseProperty = {
      id:
        'property-1',

      professionalProfileId:
        'profile-1',

      title:
        'Modern Apartment in Lisbon',

      description:
        'Beautiful modern apartment',

      location:
        'Lisbon',

      region:
        'Lisboa',

      city:
        'Lisbon',

      price:
        350000,

      propertyType:
        'Apartment',

      status:
        PropertyStatus.DRAFT,

      featured:
        false,

      bedrooms:
        2,

      bathrooms:
        2,

      area:
        110,

      landArea:
        null,

      constructionYear:
        2024,

      equipments: [
        'Balcony',
        'Parking',
      ],

      imageUrls: [
        'https://example.com/property.jpg',
      ],

      createdAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      updatedAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      professionalProfile: {
        ...activeAgentProfile,

        user: {
          id:
            'professional-user-1',

          fullName:
            'Ana Agent',

          email:
            'ana@example.com',

          role:
            Role.PROFESSIONAL,
        },
      },
    };

   beforeEach(() => {
  prisma = {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    professionalProfile: {
      findUnique: jest.fn(),
    },
  };

  propertyAlertsService = {
    checkNewProperty: jest.fn(),
  };

  service = new PropertiesService(
    prisma as unknown as PrismaService,
    propertyAlertsService as unknown as PropertyAlertsService,
  );
});

    /*
     * ============================================================
     * INITIALIZATION
     * ============================================================
     */

    describe(
      'initialization',
      () => {
        it(
          'should be defined',
          () => {
            expect(
              service,
            ).toBeDefined();
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND ALL
     * ============================================================
     */

    describe(
      'findAll',
      () => {
        it(
          'should return all properties for admin',
          async () => {
            prisma.property
              .findMany
              .mockResolvedValue([
                baseProperty,
              ]);

            const result =
              await service.findAll(
                adminUser,
              );

            expect(
              result,
            ).toEqual([
              baseProperty,
            ]);

            expect(
              prisma.property
                .findMany,
            ).toHaveBeenCalledWith({
              orderBy: {
                createdAt:
                  'desc',
              },

              include: {
                professionalProfile: {
                  include: {
                    user: {
                      select: {
                        id:
                          true,

                        fullName:
                          true,

                        email:
                          true,

                        role:
                          true,
                      },
                    },
                  },
                },
              },
            });
          },
        );

        it(
          'should return only professional own properties',
          async () => {
            prisma.professionalProfile
              .findUnique
              .mockResolvedValue(
                activeAgentProfile,
              );

            prisma.property
              .findMany
              .mockResolvedValue([
                baseProperty,
              ]);

            const result =
              await service.findAll(
                professionalUser,
              );

            expect(
              result,
            ).toEqual([
              baseProperty,
            ]);

            expect(
              prisma.property
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                professionalProfileId:
                  'profile-1',
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });
          },
        );

        it(
          'should reject buyers',
          async () => {
            await expect(
              service.findAll(
                buyerUser,
              ),
            ).rejects.toThrow(
              'Buyers cannot access property management',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND ONE
     * ============================================================
     */

    describe(
      'findOne',
      () => {
        it(
          'should return property for admin',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                baseProperty,
              );

            const result =
              await service.findOne(
                'property-1',
                adminUser,
              );

            expect(
              result,
            ).toEqual(
              baseProperty,
            );
          },
        );

        it(
          'should return own property for active property agent',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                baseProperty,
              );

            prisma.professionalProfile
              .findUnique
              .mockResolvedValue(
                activeAgentProfile,
              );

            const result =
              await service.findOne(
                'property-1',
                professionalUser,
              );

            expect(
              result,
            ).toEqual(
              baseProperty,
            );

            expect(
              prisma.professionalProfile
                .findUnique,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'professional-user-1',
              },
            });
          },
        );

        it(
          'should throw when property does not exist',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findOne(
                'missing-property',
                adminUser,
              ),
            ).rejects
              .toBeInstanceOf(
                NotFoundException,
              );
          },
        );

        it(
          'should reject buyer property management access',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                baseProperty,
              );

            await expect(
              service.findOne(
                'property-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'Buyers cannot access property management',
            );
          },
        );

        it(
          'should reject professional accessing another agent property',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...baseProperty,

                professionalProfile: {
                  ...activeAgentProfile,

                  userId:
                    'another-professional',

                  user: {
                    id:
                      'another-professional',

                    fullName:
                      'Another Agent',

                    email:
                      'other@example.com',

                    role:
                      Role.PROFESSIONAL,
                  },
                },
              });

            await expect(
              service.findOne(
                'property-1',
                professionalUser,
              ),
            ).rejects.toThrow(
              'You can only access your own properties',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROPERTY AGENT SECURITY
     * ============================================================
     */

    describe(
      'property agent security',
      () => {
        it(
          'should reject professional without profile',
          async () => {
            prisma.professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findAll(
                professionalUser,
              ),
            ).rejects.toThrow(
              'Professional profile not found',
            );
          },
        );

        it(
          'should reject professional who is not a property agent',
          async () => {
            prisma.professionalProfile
              .findUnique
              .mockResolvedValue({
                ...activeAgentProfile,

                professionalType:
                  'MORTGAGE_BROKER',
              });

            await expect(
              service.findAll(
                professionalUser,
              ),
            ).rejects.toThrow(
              'Only property agents can access property management',
            );
          },
        );

        it(
          'should reject inactive property agent',
          async () => {
            prisma.professionalProfile
              .findUnique
              .mockResolvedValue({
                ...activeAgentProfile,

                verificationStatus:
                  VerificationStatus.PENDING,
              });

            await expect(
              service.findAll(
                professionalUser,
              ),
            ).rejects.toThrow(
              'Professional profile must be active',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    describe(
      'create',
      () => {
        const createDto = {
          title:
            'Modern Apartment in Lisbon',

          description:
            'Beautiful modern apartment',

          location:
            'Lisbon',

          region:
            'Lisboa',

          city:
            'Lisbon',

          price:
            350000,

          propertyType:
            'Apartment',

          bedrooms:
            2,

          bathrooms:
            2,

          area:
            110,

          landArea:
            undefined,

          constructionYear:
            2024,

          equipments: [
            'Balcony',
            'Parking',
          ],

          imageUrls: [
            'https://example.com/property.jpg',
          ],
        } as CreatePropertyDto;

        it(
          'should reject non professional users',
          async () => {
            await expect(
              service.create(
                createDto,
                adminUser,
              ),
            ).rejects.toThrow(
              'Only active property agents can create properties',
            );
          },
        );

        it(
          'should create property as DRAFT by default',
          async () => {
            prisma.professionalProfile
              .findUnique
              .mockResolvedValue(
                activeAgentProfile,
              );

            prisma.property
              .create
              .mockResolvedValue(
                baseProperty,
              );

            const result =
              await service.create(
                createDto,
                professionalUser,
              );

            expect(
              prisma.property
                .create,
            ).toHaveBeenCalledWith({
              data:
                expect.objectContaining({
                  professionalProfileId:
                    'profile-1',

                  title:
                    'Modern Apartment in Lisbon',

                  status:
                    PropertyStatus.DRAFT,

                  featured:
                    false,
                }),
            });

            expect(
              result.status,
            ).toBe(
              PropertyStatus.DRAFT,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should create published property and trigger alerts',
          async () => {
            const publishedDto = {
              ...createDto,

              status:
                PropertyStatus.PUBLISHED,
            };

            prisma.professionalProfile
              .findUnique
              .mockResolvedValue(
                activeAgentProfile,
              );

            prisma.property
              .create
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            propertyAlertsService
              .checkNewProperty
              .mockResolvedValue({
                matchedSearches:
                  2,

                notificationsCreated:
                  2,
              });

            const result =
              await service.create(
                publishedDto,
                professionalUser,
              );

            expect(
              result.status,
            ).toBe(
              PropertyStatus.PUBLISHED,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).toHaveBeenCalledWith(
              'property-1',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    describe(
      'update',
      () => {
        it(
          'should update property',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                baseProperty,
              );

            prisma.property
              .update
              .mockResolvedValue({
                ...baseProperty,

                title:
                  'Updated Apartment',
              });

            const dto = {
              title:
                'Updated Apartment',
            } as UpdatePropertyDto;

            const result =
              await service.update(
                'property-1',
                dto,
                adminUser,
              );

            expect(
              result.title,
            ).toBe(
              'Updated Apartment',
            );

            expect(
              prisma.property
                .update,
            ).toHaveBeenCalled();
          },
        );

        it(
          'should trigger alerts when DRAFT becomes PUBLISHED',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.DRAFT,
              });

            prisma.property
              .update
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            propertyAlertsService
              .checkNewProperty
              .mockResolvedValue({
                matchedSearches:
                  1,

                notificationsCreated:
                  1,
              });

            const dto = {
              status:
                PropertyStatus.PUBLISHED,
            } as UpdatePropertyDto;

            await service.update(
              'property-1',
              dto,
              adminUser,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).toHaveBeenCalledWith(
              'property-1',
            );
          },
        );

        it(
          'should trigger alerts when ARCHIVED becomes PUBLISHED',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.ARCHIVED,
              });

            prisma.property
              .update
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            propertyAlertsService
              .checkNewProperty
              .mockResolvedValue({
                matchedSearches:
                  1,

                notificationsCreated:
                  1,
              });

            await service.update(
              'property-1',
              {
                status:
                  PropertyStatus.PUBLISHED,
              } as UpdatePropertyDto,
              adminUser,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).toHaveBeenCalledWith(
              'property-1',
            );
          },
        );

        it(
          'should not trigger alerts when PUBLISHED stays PUBLISHED',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            prisma.property
              .update
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            await service.update(
              'property-1',
              {
                title:
                  'Updated title',
              } as UpdatePropertyDto,
              adminUser,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should not trigger alerts when PUBLISHED becomes ARCHIVED',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            prisma.property
              .update
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.ARCHIVED,
              });

            await service.update(
              'property-1',
              {
                status:
                  PropertyStatus.ARCHIVED,
              } as UpdatePropertyDto,
              adminUser,
            );

            expect(
              propertyAlertsService
                .checkNewProperty,
            ).not
              .toHaveBeenCalled();
          },
        );
      },
    );

    /*
     * ============================================================
     * REMOVE
     * ============================================================
     */

    describe(
      'remove',
      () => {
        it(
          'should delete property',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                baseProperty,
              );

            prisma.property
              .delete
              .mockResolvedValue(
                baseProperty,
              );

            const result =
              await service.remove(
                'property-1',
                adminUser,
              );

            expect(
              prisma.property
                .delete,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'property-1',
              },
            });

            expect(
              result,
            ).toEqual({
              message:
                'Property deleted successfully',
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * PUBLIC PROPERTIES
     * ============================================================
     */

    describe(
      'findPublic',
      () => {
        it(
          'should return only published properties',
          async () => {
            prisma.property
              .findMany
              .mockResolvedValue([
                {
                  ...baseProperty,

                  status:
                    PropertyStatus.PUBLISHED,
                },
              ]);

            const result =
              await service.findPublic();

            expect(
              result,
            ).toHaveLength(
              1,
            );

            expect(
              prisma.property
                .findMany,
            ).toHaveBeenCalledWith({
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
          },
        );
      },
    );

    /*
     * ============================================================
     * PUBLIC PROPERTY DETAILS
     * ============================================================
     */

    describe(
      'findPublicOne',
      () => {
        it(
          'should return published property',
          async () => {
            prisma.property
              .findFirst
              .mockResolvedValue({
                ...baseProperty,

                status:
                  PropertyStatus.PUBLISHED,
              });

            const result =
              await service.findPublicOne(
                'property-1',
              );

            expect(
              result.id,
            ).toBe(
              'property-1',
            );

            expect(
              prisma.property
                .findFirst,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  id:
                    'property-1',

                  status:
                    PropertyStatus.PUBLISHED,
                },
              }),
            );
          },
        );

        it(
          'should throw when public property does not exist',
          async () => {
            prisma.property
              .findFirst
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findPublicOne(
                'missing-property',
              ),
            ).rejects
              .toBeInstanceOf(
                NotFoundException,
              );
          },
        );
      },
    );
  },
);