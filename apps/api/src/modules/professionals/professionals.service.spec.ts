import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  NotificationType,
  ProfessionalType,
  Role,
  VerificationStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  NotificationsService,
} from '../notifications/notifications.service';

import {
  EmailService,
} from '../email/email.service';

import {
  ProfessionalsService,
} from './professionals.service';

import {
  CreateProfessionalDto,
} from './dto/create-professional.dto';

import {
  CreateProfessionalApplicationDto,
} from './dto/create-professional-application.dto';

describe(
  'ProfessionalsService',
  () => {
    let service:
      ProfessionalsService;

    let prisma: {
      user: {
        findUnique:
          jest.Mock;

        update:
          jest.Mock;
      };

      professionalProfile: {
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
      };

      $transaction:
        jest.Mock;
    };

    let notificationsService: {
      create:
        jest.Mock;
    };

    let emailService: {
      sendMail:
        jest.Mock;
    };

    const buyer = {
      id:
        'buyer-1',

      email:
        'buyer@example.com',

      fullName:
        'John Buyer',

      role:
        Role.BUYER,

      avatarUrl:
        null,

      professionalProfile:
        null,
    };

    const professionalUser = {
      id:
        'professional-user-1',

      email:
        'ana@example.com',

      fullName:
        'Ana Costa',

      role:
        Role.PROFESSIONAL,

      avatarUrl:
        null,
    };

    const pendingProfessional = {
      id:
        'professional-1',

      userId:
        'professional-user-1',

      professionalType:
        ProfessionalType.PROPERTY_AGENT,

      companyName:
        'Lisbon Realty',

      bio:
        'Property specialist in Lisbon',

      languages: [
        'English',
        'Portuguese',
      ],

      rating:
        0,

      reviewsCount:
        0,

      clientsCount:
        0,

      verificationStatus:
        VerificationStatus.PENDING,

      isFeatured:
        false,

      profileCompletion:
        100,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),

      user:
        professionalUser,
    };

    beforeEach(() => {
      prisma = {
        user: {
          findUnique:
            jest.fn(),

          update:
            jest.fn(),
        },

        professionalProfile: {
          findMany:
            jest.fn(),

          findUnique:
            jest.fn(),

          findFirst:
            jest.fn(),

          create:
            jest.fn(),

          update:
            jest.fn(),
        },

        $transaction:
          jest.fn(),
      };

      notificationsService = {
        create:
          jest.fn(),
      };

      emailService = {
        sendMail:
          jest.fn(),
      };

      service =
        new ProfessionalsService(
          prisma as unknown as PrismaService,
          notificationsService as unknown as NotificationsService,
          emailService as unknown as EmailService,
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
          'should return all professionals newest first',
          async () => {
            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue([
                pendingProfessional,
              ]);

            const result =
              await service.findAll();

            expect(
              result,
            ).toEqual([
              pendingProfessional,
            ]);

            expect(
              prisma
                .professionalProfile
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                orderBy: {
                  createdAt:
                    'desc',
                },
              }),
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND PENDING
     * ============================================================
     */

    describe(
      'findPending',
      () => {
        it(
          'should return only pending professionals',
          async () => {
            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue([
                pendingProfessional,
              ]);

            const result =
              await service
                .findPending();

            expect(
              result,
            ).toEqual([
              pendingProfessional,
            ]);

            expect(
              prisma
                .professionalProfile
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  verificationStatus:
                    VerificationStatus.PENDING,
                },

                orderBy: {
                  createdAt:
                    'desc',
                },
              }),
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
          'should return professional',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            const result =
              await service.findOne(
                'professional-1',
              );

            expect(
              result,
            ).toEqual(
              pendingProfessional,
            );
          },
        );

        it(
          'should throw when professional does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findOne(
                'missing-professional',
              ),
            ).rejects
              .toBeInstanceOf(
                NotFoundException,
              );

            await expect(
              service.findOne(
                'missing-professional',
              ),
            ).rejects.toThrow(
              'Professional not found',
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
          userId:
            'professional-user-1',

          professionalType:
            ProfessionalType.PROPERTY_AGENT,

          companyName:
            'Lisbon Realty',

          bio:
            'Lisbon property specialist',

          languages: [
            'English',
            'Portuguese',
          ],

          rating:
            0,

          reviewsCount:
            0,

          clientsCount:
            0,

          verificationStatus:
            VerificationStatus.PENDING,

          isFeatured:
            false,

          profileCompletion:
            100,
        } as CreateProfessionalDto;

        it(
          'should throw when user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.create(
                createDto,
              ),
            ).rejects.toThrow(
              'User not found',
            );
          },
        );

        it(
          'should require PROFESSIONAL role',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                role:
                  Role.BUYER,
              });

            await expect(
              service.create(
                createDto,
              ),
            ).rejects.toThrow(
              'User must have PROFESSIONAL role',
            );
          },
        );

        it(
          'should reject duplicate professional profile',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                professionalUser,
              );

            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            await expect(
              service.create(
                createDto,
              ),
            ).rejects.toThrow(
              'Professional profile already exists',
            );
          },
        );

        it(
          'should create professional profile',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                professionalUser,
              );

            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            prisma
              .professionalProfile
              .create
              .mockResolvedValue(
                pendingProfessional,
              );

            const result =
              await service.create(
                createDto,
              );

            expect(
              result,
            ).toEqual(
              pendingProfessional,
            );

            expect(
              prisma
                .professionalProfile
                .create,
            ).toHaveBeenCalledWith({
              data:
                expect.objectContaining({
                  userId:
                    'professional-user-1',

                  professionalType:
                    ProfessionalType.PROPERTY_AGENT,

                  companyName:
                    'Lisbon Realty',

                  verificationStatus:
                    VerificationStatus.PENDING,
                }),
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * APPROVE APPLICATION
     * ============================================================
     */

    describe(
      'approve',
      () => {
        it(
          'should throw when application does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.approve(
                'missing-professional',
              ),
            ).rejects.toThrow(
              'Professional application not found',
            );
          },
        );

        it(
          'should reject already approved application',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                ...pendingProfessional,

                verificationStatus:
                  VerificationStatus.ACTIVE,
              });

            await expect(
              service.approve(
                'professional-1',
              ),
            ).rejects.toThrow(
              'This professional application is already approved',
            );
          },
        );

        it(
          'should reject application that is not pending',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                ...pendingProfessional,

                verificationStatus:
                  VerificationStatus.REJECTED,
              });

            await expect(
              service.approve(
                'professional-1',
              ),
            ).rejects.toThrow(
              'Only pending professional applications can be approved',
            );
          },
        );

        it(
          'should approve application and promote user to PROFESSIONAL',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            const activeProfessional = {
              ...pendingProfessional,

              verificationStatus:
                VerificationStatus.ACTIVE,

              user: {
                ...professionalUser,

                role:
                  Role.PROFESSIONAL,
              },
            };

            const tx = {
              user: {
                update:
                  jest.fn()
                    .mockResolvedValue({
                      ...professionalUser,

                      role:
                        Role.PROFESSIONAL,
                    }),
              },

              professionalProfile: {
                update:
                  jest.fn()
                    .mockResolvedValue(
                      activeProfessional,
                    ),
              },
            };

            prisma.$transaction.mockImplementation(
              async (
                callback:
                  (
                    transaction: typeof tx,
                  ) =>
                    Promise<unknown>,
              ) =>
                callback(
                  tx,
                ),
            );

            notificationsService
              .create
              .mockResolvedValue(
                {},
              );

            emailService
              .sendMail
              .mockResolvedValue(
                undefined,
              );

            const result =
              await service.approve(
                'professional-1',
              );

            expect(
              tx.user.update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'professional-user-1',
              },

              data: {
                role:
                  Role.PROFESSIONAL,
              },
            });

            expect(
              tx
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  id:
                    'professional-1',
                },

                data: {
                  verificationStatus:
                    VerificationStatus.ACTIVE,
                },
              }),
            );

            expect(
              notificationsService
                .create,
            ).toHaveBeenCalledWith({
              userId:
                'professional-user-1',

              title:
                'Professional Profile Approved',

              message:
                'Your professional profile has been approved. Sign in again to access your professional workspace.',

              type:
                NotificationType.SYSTEM,
            });

            expect(
              result
                .verificationStatus,
            ).toBe(
              VerificationStatus.ACTIVE,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * REJECT APPLICATION
     * ============================================================
     */

    describe(
      'reject',
      () => {
        it(
          'should throw when application does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.reject(
                'missing-professional',
              ),
            ).rejects.toThrow(
              'Professional application not found',
            );
          },
        );

        it(
          'should reject an already rejected application',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                ...pendingProfessional,

                verificationStatus:
                  VerificationStatus.REJECTED,
              });

            await expect(
              service.reject(
                'professional-1',
              ),
            ).rejects.toThrow(
              'This professional application is already rejected',
            );
          },
        );

        it(
          'should reject non pending application',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                ...pendingProfessional,

                verificationStatus:
                  VerificationStatus.ACTIVE,
              });

            await expect(
              service.reject(
                'professional-1',
              ),
            ).rejects.toThrow(
              'Only pending professional applications can be rejected',
            );
          },
        );

        it(
          'should reject application and restore BUYER role',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            const rejectedProfessional = {
              ...pendingProfessional,

              verificationStatus:
                VerificationStatus.REJECTED,
            };

            const tx = {
              user: {
                update:
                  jest.fn()
                    .mockResolvedValue({
                      ...professionalUser,

                      role:
                        Role.BUYER,
                    }),
              },

              professionalProfile: {
                update:
                  jest.fn()
                    .mockResolvedValue(
                      rejectedProfessional,
                    ),
              },
            };

            prisma.$transaction.mockImplementation(
              async (
                callback:
                  (
                    transaction: typeof tx,
                  ) =>
                    Promise<unknown>,
              ) =>
                callback(
                  tx,
                ),
            );

            notificationsService
              .create
              .mockResolvedValue(
                {},
              );

            emailService
              .sendMail
              .mockResolvedValue(
                undefined,
              );

            const result =
              await service.reject(
                'professional-1',
              );

            expect(
              tx.user.update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'professional-user-1',
              },

              data: {
                role:
                  Role.BUYER,
              },
            });

            expect(
              tx
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data: {
                  verificationStatus:
                    VerificationStatus.REJECTED,
                },
              }),
            );

            expect(
              notificationsService
                .create,
            ).toHaveBeenCalledWith({
              userId:
                'professional-user-1',

              title:
                'Professional Profile Rejected',

              message:
                'Your professional application has been rejected. Please contact support for more information.',

              type:
                NotificationType.SYSTEM,
            });

            expect(
              result
                .verificationStatus,
            ).toBe(
              VerificationStatus.REJECTED,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PUBLIC PROFESSIONALS
     * ============================================================
     */

    describe(
      'findPublicByType',
      () => {
        it(
          'should return only ACTIVE professionals',
          async () => {
            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            await service
              .findPublicByType();

            expect(
              prisma
                .professionalProfile
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  verificationStatus:
                    VerificationStatus.ACTIVE,
                },
              }),
            );
          },
        );

        it(
          'should filter public professionals by type',
          async () => {
            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            await service
              .findPublicByType(
                ProfessionalType.MORTGAGE_BROKER,
              );

            expect(
              prisma
                .professionalProfile
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  verificationStatus:
                    VerificationStatus.ACTIVE,

                  professionalType:
                    ProfessionalType.MORTGAGE_BROKER,
                },
              }),
            );
          },
        );
      },
    );

    describe(
      'findPublicOne',
      () => {
        it(
          'should return active public professional',
          async () => {
            prisma
              .professionalProfile
              .findFirst
              .mockResolvedValue({
                ...pendingProfessional,

                verificationStatus:
                  VerificationStatus.ACTIVE,
              });

            const result =
              await service
                .findPublicOne(
                  'professional-1',
                );

            expect(
              result.id,
            ).toBe(
              'professional-1',
            );

            expect(
              prisma
                .professionalProfile
                .findFirst,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  id:
                    'professional-1',

                  verificationStatus:
                    VerificationStatus.ACTIVE,
                },
              }),
            );
          },
        );

        it(
          'should throw when public professional does not exist',
          async () => {
            prisma
              .professionalProfile
              .findFirst
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findPublicOne(
                'missing-professional',
              ),
            ).rejects.toThrow(
              'Professional not found',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND ME
     * ============================================================
     */

    describe(
      'findMe',
      () => {
        it(
          'should return authenticated professional profile',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            const result =
              await service.findMe(
                'professional-user-1',
              );

            expect(
              result,
            ).toEqual(
              pendingProfessional,
            );

            expect(
              prisma
                .professionalProfile
                .findUnique,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  userId:
                    'professional-user-1',
                },
              }),
            );
          },
        );

        it(
          'should throw when professional profile does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findMe(
                'missing-user',
              ),
            ).rejects.toThrow(
              'Professional profile not found',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * UPDATE ME
     * ============================================================
     */

    describe(
      'updateMe',
      () => {
        it(
          'should create profile when it does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            prisma
              .professionalProfile
              .create
              .mockResolvedValue(
                pendingProfessional,
              );

            const result =
              await service.updateMe(
                'professional-user-1',
                {
                  companyName:
                    'Lisbon Realty',

                  professionalType:
                    ProfessionalType.PROPERTY_AGENT,

                  bio:
                    'Lisbon specialist',

                  languages: [
                    'English',
                    'Portuguese',
                  ],
                },
              );

            expect(
              prisma
                .professionalProfile
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    userId:
                      'professional-user-1',

                    verificationStatus:
                      VerificationStatus.PENDING,

                    rating:
                      0,

                    reviewsCount:
                      0,

                    clientsCount:
                      0,

                    isFeatured:
                      false,

                    profileCompletion:
                      100,
                  }),
              }),
            );

            expect(
              result,
            ).toEqual(
              pendingProfessional,
            );
          },
        );

        it(
          'should update existing professional profile',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                pendingProfessional,
              );

            prisma
              .professionalProfile
              .update
              .mockResolvedValue({
                ...pendingProfessional,

                companyName:
                  'Updated Realty',
              });

            const result =
              await service.updateMe(
                'professional-user-1',
                {
                  companyName:
                    'Updated Realty',

                  professionalType:
                    ProfessionalType.PROPERTY_AGENT,

                  bio:
                    'Updated bio',

                  languages: [
                    'English',
                  ],
                },
              );

            expect(
              prisma
                .professionalProfile
                .update,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  userId:
                    'professional-user-1',
                },

                data:
                  expect.objectContaining({
                    companyName:
                      'Updated Realty',

                    profileCompletion:
                      100,
                  }),
              }),
            );

            expect(
              result.companyName,
            ).toBe(
              'Updated Realty',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * APPLY
     * ============================================================
     */

    describe(
      'apply',
      () => {
        const applicationDto = {
          professionalType:
            ProfessionalType.PROPERTY_AGENT,

          companyName:
            'Lisbon Realty',

          bio:
            'Professional property specialist',

          languages: [
            ' English ',
            'Portuguese',
            'English',
          ],
        } as CreateProfessionalApplicationDto;

        it(
          'should throw when user does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.apply(
                'missing-user',
                applicationDto,
              ),
            ).rejects.toThrow(
              'User not found',
            );
          },
        );

        it(
          'should reject administrator application',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                role:
                  Role.ADMIN,
              });

            await expect(
              service.apply(
                'admin-1',
                applicationDto,
              ),
            ).rejects.toThrow(
              'Administrator accounts cannot submit a professional application',
            );
          },
        );

        it(
          'should reject existing pending application',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                professionalProfile: {
                  verificationStatus:
                    VerificationStatus.PENDING,
                },
              });

            await expect(
              service.apply(
                buyer.id,
                applicationDto,
              ),
            ).rejects.toThrow(
              'Your professional application is already under review',
            );
          },
        );

        it(
          'should reject active professional application',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...professionalUser,

                role:
                  Role.PROFESSIONAL,

                professionalProfile: {
                  verificationStatus:
                    VerificationStatus.ACTIVE,
                },
              });

            await expect(
              service.apply(
                professionalUser.id,
                applicationDto,
              ),
            ).rejects.toThrow(
              'This account is already an active professional',
            );
          },
        );

        it(
          'should reject application without valid language',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            await expect(
              service.apply(
                buyer.id,
                {
                  ...applicationDto,

                  languages: [
                    ' ',
                    '   ',
                  ],
                },
              ),
            ).rejects.toThrow(
              'At least one language is required',
            );
          },
        );

        it(
          'should create normalized pending application',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            const createdProfile = {
              ...pendingProfessional,

              userId:
                buyer.id,

              languages: [
                'English',
                'Portuguese',
              ],

              user:
                buyer,
            };

            prisma
              .professionalProfile
              .create
              .mockResolvedValue(
                createdProfile,
              );

            const result =
              await service.apply(
                buyer.id,
                applicationDto,
              );

            expect(
              prisma
                .professionalProfile
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                data:
                  expect.objectContaining({
                    userId:
                      buyer.id,

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    companyName:
                      'Lisbon Realty',

                    bio:
                      'Professional property specialist',

                    languages: [
                      'English',
                      'Portuguese',
                    ],

                    verificationStatus:
                      VerificationStatus.PENDING,

                    rating:
                      0,

                    reviewsCount:
                      0,

                    clientsCount:
                      0,

                    isFeatured:
                      false,

                    profileCompletion:
                      100,
                  }),
              }),
            );

            expect(
              result.message,
            ).toBe(
              'Professional application submitted successfully',
            );

            expect(
              result.professionalProfile,
            ).toEqual(
              createdProfile,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * GET MY APPLICATION
     * ============================================================
     */

    describe(
      'getMyApplication',
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
              service
                .getMyApplication(
                  'missing-user',
                ),
            ).rejects.toThrow(
              'User not found',
            );
          },
        );

        it(
          'should return current application',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue({
                ...buyer,

                professionalProfile:
                  pendingProfessional,
              });

            const result =
              await service
                .getMyApplication(
                  buyer.id,
                );

            expect(
              result,
            ).toEqual({
              role:
                Role.BUYER,

              professionalProfile:
                pendingProfessional,
            });
          },
        );
      },
    );
  },
);