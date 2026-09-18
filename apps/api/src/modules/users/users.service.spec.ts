import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  MatchStatus,
  ProfileTier,
  Role,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  UsersService,
} from './users.service';

describe(
  'UsersService',
  () => {
    let service:
      UsersService;

    let prisma: {
      user: {
        findMany:
          jest.Mock;

        findUnique:
          jest.Mock;

        delete:
          jest.Mock;

        update:
          jest.Mock;
      };
    };

    const baseUser = {
      id:
        'user-1',

      email:
        'user@example.com',

      fullName:
        'John Buyer',

      role:
        Role.BUYER,

      phone:
        '+351910000000',

      country:
        'Portugal',

      city:
        'Lisbon',

      avatarUrl:
        'https://example.com/avatar.jpg',

      createdAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      updatedAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),
    };

    beforeEach(() => {
      prisma = {
        user: {
          findMany:
            jest.fn(),

          findUnique:
            jest.fn(),

          delete:
            jest.fn(),

          update:
            jest.fn(),
        },
      };

      service =
        new UsersService(
          prisma as unknown as PrismaService,
        );
    });

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

    describe(
      'findAll',
      () => {
        it(
          'should return all users ordered newest first',
          async () => {
            prisma.user
              .findMany
              .mockResolvedValue([
                baseUser,
              ]);

            const result =
              await service.findAll();

            expect(
              result,
            ).toEqual([
              baseUser,
            ]);

            expect(
              prisma.user.findMany,
            ).toHaveBeenCalledWith({
              orderBy: {
                createdAt:
                  'desc',
              },

              select: {
                id:
                  true,

                email:
                  true,

                fullName:
                  true,

                role:
                  true,

                phone:
                  true,

                country:
                  true,

                city:
                  true,

                avatarUrl:
                  true,

                createdAt:
                  true,

                updatedAt:
                  true,
              },
            });
          },
        );
      },
    );

    describe(
      'findOne',
      () => {
        it(
          'should return user by id',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                baseUser,
              );

            const result =
              await service.findOne(
                'user-1',
              );

            expect(
              result,
            ).toEqual(
              baseUser,
            );

            expect(
              prisma.user.findUnique,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'user-1',
              },

              select: {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    avatarUrl: true,
    country: true,
    city: true,
    role: true,

    emailNotifications: true,
    leadNotifications: true,
    matchNotifications: true,
    propertyAlertNotifications: true,

    createdAt: true,
    updatedAt: true,
              },
            });
          },
        );

        it(
          'should throw when user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findOne(
                'missing-user',
              ),
            ).rejects.toBeInstanceOf(
              NotFoundException,
            );

            await expect(
              service.findOne(
                'missing-user',
              ),
            ).rejects.toThrow(
              'User not found',
            );
          },
        );
      },
    );

    describe(
      'remove',
      () => {
        it(
          'should reject self deletion',
          async () => {
            await expect(
              service.remove(
                'user-1',
                'user-1',
              ),
            ).rejects.toBeInstanceOf(
              ForbiddenException,
            );

            await expect(
              service.remove(
                'user-1',
                'user-1',
              ),
            ).rejects.toThrow(
              'You cannot delete your own account',
            );

            expect(
              prisma.user.delete,
            ).not.toHaveBeenCalled();
          },
        );

        it(
          'should throw when target user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.remove(
                'missing-user',
                'admin-1',
              ),
            ).rejects.toThrow(
              'User not found',
            );

            expect(
              prisma.user.delete,
            ).not.toHaveBeenCalled();
          },
        );

        it(
          'should delete another user',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                baseUser,
              );

            prisma.user
              .delete
              .mockResolvedValue(
                baseUser,
              );

            const result =
              await service.remove(
                'user-1',
                'admin-1',
              );

            expect(
              prisma.user.delete,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'user-1',
              },
            });

            expect(
              result,
            ).toEqual({
              message:
                'User deleted successfully',
            });
          },
        );
      },
    );

    describe(
      'updateMe',
      () => {
        it(
          'should update personal profile fields',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                baseUser,
              );

            prisma.user
              .update
              .mockResolvedValue({
                ...baseUser,

                fullName:
                  'John Updated',

                city:
                  'Cascais',
              });

            const result =
              await service.updateMe(
                'user-1',
                {
                  fullName:
                    'John Updated',

                  phone:
                    '+351920000000',

                  country:
                    'Portugal',

                  city:
                    'Cascais',

                  avatarUrl:
                    'https://example.com/new-avatar.jpg',
                },
              );

            expect(
              prisma.user.update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'user-1',
              },

              data: {
                fullName:
                  'John Updated',

                phone:
                  '+351920000000',

                country:
                  'Portugal',

                city:
                  'Cascais',

                avatarUrl:
                  'https://example.com/new-avatar.jpg',
              },

              select: {
                id:
                  true,

                email:
                  true,

                fullName:
                  true,

                role:
                  true,

                phone:
                  true,

                country:
                  true,

                city:
                  true,

                avatarUrl:
                  true,

                createdAt:
                  true,

                updatedAt:
                  true,
              },
            });

            expect(
              result.fullName,
            ).toBe(
              'John Updated',
            );
          },
        );

        it(
          'should not update when user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.updateMe(
                'missing-user',
                {
                  fullName:
                    'Test',
                },
              ),
            ).rejects.toThrow(
              'User not found',
            );

            expect(
              prisma.user.update,
            ).not.toHaveBeenCalled();
          },
        );
      },
    );

    describe(
      'updateAvatar',
      () => {
        it(
          'should update avatar URL',
          async () => {
            prisma.user
              .update
              .mockResolvedValue({
                ...baseUser,

                avatarUrl:
                  'https://example.com/avatar-new.jpg',
              });

            const result =
              await service.updateAvatar(
                'user-1',
                'https://example.com/avatar-new.jpg',
              );

            expect(
              prisma.user.update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'user-1',
              },

              data: {
                avatarUrl:
                  'https://example.com/avatar-new.jpg',
              },

              select: {
                id:
                  true,

                email:
                  true,

                fullName:
                  true,

                role:
                  true,

                phone:
                  true,

                country:
                  true,

                city:
                  true,

                avatarUrl:
                  true,
              },
            });

            expect(
              result.avatarUrl,
            ).toBe(
              'https://example.com/avatar-new.jpg',
            );
          },
        );
      },
    );

    describe(
      'getProfileProgress',
      () => {
        it(
          'should return profile completion information',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'user-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                role:
                  Role.BUYER,

                profileCompletion:
                  75,

                profileTier:
                  ProfileTier.ACTIVE_BUYER,
              });

            const result =
              await service
                .getProfileProgress(
                  'user-1',
                );

            expect(
              result,
            ).toEqual({
              id:
                'user-1',

              fullName:
                'John Buyer',

              email:
                'john@example.com',

              role:
                Role.BUYER,

              profileCompletion:
                75,

              profileTier:
                ProfileTier.ACTIVE_BUYER,
            });
          },
        );
      },
    );

    describe(
      'getMyProfile',
      () => {
        it(
          'should throw when user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.getMyProfile(
                'missing-user',
              ),
            ).rejects.toThrow(
              'User not found',
            );
          },
        );

        it(
          'should return complete buyer profile summary',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  80,

                profileTier:
                  ProfileTier.QUALIFIED,

                leads: [
                  {
                    id:
                      'lead-1',

                    source:
                      'Mortgage Calculator',

                    status:
                      'MATCHED',
                  },

                  {
                    id:
                      'lead-2',

                    source:
                      'Property Search Assistant',

                    status:
                      'NEW',
                  },
                ],

                matchesAsBuyer: [
                  {
                    id:
                      'match-1',

                    status:
                      MatchStatus.CONTACTED,
                  },
                ],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.usedTools,
            ).toEqual([
              'Mortgage Calculator',
              'Property Search Assistant',
            ]);

            expect(
              result.totalRequests,
            ).toBe(
              2,
            );

            expect(
              result.totalMatches,
            ).toBe(
              1,
            );

            expect(
              result.nextSteps,
            ).toEqual(
              [],
            );

            expect(
              result.journey,
            ).toEqual({
              accountCreated:
                true,

              profileCompleted:
                true,

              firstToolCompleted:
                true,

              matchedWithProfessional:
                true,

              contactedProfessional:
                true,

              completedJourney:
                false,
            });
          },
        );

        it(
          'should remove duplicate tools from usedTools',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  50,

                profileTier:
                  ProfileTier.EXPLORER,

                leads: [
                  {
                    id:
                      'lead-1',

                    source:
                      'Mortgage Calculator',

                    status:
                      'NEW',
                  },

                  {
                    id:
                      'lead-2',

                    source:
                      'Mortgage Calculator',

                    status:
                      'MATCHED',
                  },
                ],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.usedTools,
            ).toEqual([
              'Mortgage Calculator',
            ]);
          },
        );

        it(
          'should recommend adding phone when missing',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  null,

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  50,

                profileTier:
                  ProfileTier.EXPLORER,

                leads:
                  [],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.nextSteps,
            ).toContain(
              'Add your phone number',
            );
          },
        );

        it(
          'should recommend location when country and city are missing',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  null,

                city:
                  null,

                profileCompletion:
                  50,

                profileTier:
                  ProfileTier.EXPLORER,

                leads:
                  [],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.nextSteps,
            ).toContain(
              'Add your country or city',
            );
          },
        );

        it(
          'should recommend another buyer tool when fewer than two tools were used',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  50,

                profileTier:
                  ProfileTier.EXPLORER,

                leads: [
                  {
                    id:
                      'lead-1',

                    source:
                      'Mortgage Calculator',

                    status:
                      'NEW',
                  },
                ],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.nextSteps,
            ).toContain(
              'Use one more buyer tool',
            );
          },
        );

        it(
          'should recommend professional matching when no match exists',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  80,

                profileTier:
                  ProfileTier.ACTIVE_BUYER,

                leads: [
                  {
                    id:
                      'lead-1',

                    source:
                      'Mortgage Calculator',

                    status:
                      'NEW',
                  },

                  {
                    id:
                      'lead-2',

                    source:
                      'True Cost Calculator',

                    status:
                      'NEW',
                  },
                ],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.nextSteps,
            ).toContain(
              'Request professional matching',
            );
          },
        );

        it(
          'should mark completed journey when completed match exists',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  90,

                profileTier:
                  ProfileTier.PRIORITY,

                leads: [
                  {
                    id:
                      'lead-1',

                    source:
                      'Mortgage Calculator',

                    status:
                      'MATCHED',
                  },

                  {
                    id:
                      'lead-2',

                    source:
                      'True Cost Calculator',

                    status:
                      'MATCHED',
                  },
                ],

                matchesAsBuyer: [
                  {
                    id:
                      'match-1',

                    status:
                      MatchStatus.COMPLETED,
                  },
                ],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.journey
                .matchedWithProfessional,
            ).toBe(
              true,
            );

            expect(
              result.journey
                .contactedProfessional,
            ).toBe(
              true,
            );

            expect(
              result.journey
                .completedJourney,
            ).toBe(
              true,
            );
          },
        );

        it(
          'should mark profile as incomplete below 60 percent',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  null,

                country:
                  null,

                city:
                  null,

                profileCompletion:
                  59,

                profileTier:
                  ProfileTier.EXPLORER,

                leads:
                  [],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.journey
                .profileCompleted,
            ).toBe(
              false,
            );

            expect(
              result.journey
                .firstToolCompleted,
            ).toBe(
              false,
            );

            expect(
              result.journey
                .matchedWithProfessional,
            ).toBe(
              false,
            );
          },
        );

        it(
          'should mark profile complete at exactly 60 percent',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                id:
                  'buyer-1',

                fullName:
                  'John Buyer',

                email:
                  'john@example.com',

                phone:
                  '+351910000000',

                country:
                  'Portugal',

                city:
                  'Lisbon',

                profileCompletion:
                  60,

                profileTier:
                  ProfileTier.ACTIVE_BUYER,

                leads:
                  [],

                matchesAsBuyer:
                  [],
              });

            const result =
              await service
                .getMyProfile(
                  'buyer-1',
                );

            expect(
              result.journey
                .profileCompleted,
            ).toBe(
              true,
            );
          },
        );
      },
    );
  },
);