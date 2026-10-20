import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  LeadQuality,
  LeadStatus,
  Role,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  LeadsService,
} from './leads.service';

import {
  UpdateLeadDto,
} from './dto/update-lead.dto';

import {
  CreateCalculatorLeadDto,
} from './dto/create-calculator-lead.dto';

import {
  LeadScoringService,
} from './lead-scoring.service';

import {
  ProfileScoreService,
} from '../users/profile-score.service';

import {
  AutoMatchingService,
} from '../matching/auto-matching.service';

describe(
  'LeadsService',
  () => {
    let service:
      LeadsService;

    /*
     * ============================================================
     * MOCKS
     * ============================================================
     */

    let prisma: {
      lead: {
        findMany: jest.Mock;
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
      };

      user: {
        findUnique: jest.Mock;
      };

      neighborhood: {
        findUnique: jest.Mock;
      };

      property: {
        findMany: jest.Mock;
      };
    };

    let leadScoringService: {
      calculateQuality:
        jest.Mock;
    };

    let profileScoreService: {
      updateUserScore:
        jest.Mock;
    };

    let autoMatchingService: {
      matchLead:
        jest.Mock;
    };

    /*
     * ============================================================
     * USERS
     * ============================================================
     */

    const buyerUser = {
      id:
        'buyer-1',

      role:
        Role.BUYER,
    };

    const adminUser = {
      id:
        'admin-1',

      role:
        Role.ADMIN,
    };

    const professionalUser = {
      id:
        'professional-1',

      role:
        Role.PROFESSIONAL,
    };

    /*
     * ============================================================
     * BUYER
     * ============================================================
     */

    const buyer = {
      id:
        'buyer-1',

      fullName:
        'John Buyer',

      email:
        'john@example.com',

      phone:
        '+351910000000',

      role:
        Role.BUYER,
    };

    /*
     * ============================================================
     * BASE LEAD
     * ============================================================
     */

    const baseLead = {
      id:
        'lead-1',

      userId:
        'buyer-1',

      fullName:
        'John Buyer',

      email:
        'john@example.com',

      phone:
        '+351910000000',

      source:
        'Mortgage Calculator',

      interest:
        'Mortgage / Property Purchase',

      location:
        'Portugal',

      budget:
        '€300000',

      quality:
        LeadQuality.HOT,

      status:
        LeadStatus.NEW,

      createdAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),

      updatedAt:
        new Date(
          '2026-08-31T10:00:00.000Z',
        ),
    };

    /*
     * ============================================================
     * CALCULATOR DTO
     * ============================================================
     */

    const calculatorDto:
      CreateCalculatorLeadDto = {
        fullName:
          'John Buyer',

        email:
          'JOHN@EXAMPLE.COM',

        phone:
          '+351910000000',

        source:
          'Mortgage Calculator',

        interest:
          'Mortgage / Property Purchase',

        location:
          'Portugal',

        budget:
          '€300000',
      };

    /*
     * ============================================================
     * SETUP
     * ============================================================
     */

    beforeEach(() => {
  prisma = {
    lead: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    user: {
      findUnique: jest.fn(),
    },

    neighborhood: {
      findUnique: jest.fn(),
    },

    property: {
      findMany: jest.fn(),
    },
  };

  leadScoringService = {
    calculateQuality: jest.fn(),
  };

  profileScoreService = {
    updateUserScore: jest.fn(),
  };

  autoMatchingService = {
    matchLead: jest.fn(),
  };

  service = new LeadsService(
    prisma as unknown as PrismaService,
    leadScoringService as unknown as LeadScoringService,
    profileScoreService as unknown as ProfileScoreService,
    autoMatchingService as unknown as AutoMatchingService,
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
          'should return all leads for admin',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue([
                baseLead,
              ]);

            const result =
              await service.findAll(
                adminUser,
              );

            expect(
              result,
            ).toEqual([
              baseLead,
            ]);

            expect(
              prisma.lead
                .findMany,
            ).toHaveBeenCalledWith({
              orderBy: {
                createdAt:
                  'desc',
              },

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

                matches:
                  true,
              },
            });
          },
        );

        it(
          'should return only buyer own leads',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue([
                baseLead,
              ]);

            const result =
              await service.findAll(
                buyerUser,
              );

            expect(
              result,
            ).toEqual([
              baseLead,
            ]);

            expect(
              prisma.lead
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  userId:
                    'buyer-1',
                },
              }),
            );
          },
        );

        it(
          'should reject professional direct lead access',
          async () => {
            await expect(
              service.findAll(
                professionalUser,
              ),
            ).rejects
              .toBeInstanceOf(
                ForbiddenException,
              );

            expect(
              prisma.lead
                .findMany,
            ).not
              .toHaveBeenCalled();
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
          'should return lead to buyer owner',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            const result =
              await service.findOne(
                'lead-1',
                buyerUser,
              );

            expect(
              result,
            ).toEqual(
              baseLead,
            );
          },
        );

        it(
          'should allow admin to access a lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            const result =
              await service.findOne(
                'lead-1',
                adminUser,
              );

            expect(
              result,
            ).toEqual(
              baseLead,
            );
          },
        );

        it(
          'should throw when lead does not exist',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service.findOne(
                'missing-lead',
                buyerUser,
              ),
            ).rejects
              .toBeInstanceOf(
                NotFoundException,
              );
          },
        );

        it(
          'should reject buyer accessing another buyer lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                userId:
                  'buyer-2',
              });

            await expect(
              service.findOne(
                'lead-1',
                buyerUser,
              ),
            ).rejects.toThrow(
              'You can only access your own leads',
            );
          },
        );

        it(
          'should reject professional direct access',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            await expect(
              service.findOne(
                'lead-1',
                professionalUser,
              ),
            ).rejects.toThrow(
              'Professionals can access leads only through matching',
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
          'should update buyer owned lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.HOT,
              );

            prisma.lead
              .update
              .mockResolvedValue({
                ...baseLead,

                phone:
                  '+351920000000',
              });

            const dto:
              UpdateLeadDto = {
                phone:
                  '+351920000000',
              };

            const result =
              await service.update(
                'lead-1',
                dto,
                buyerUser,
              );

            expect(
              result.phone,
            ).toBe(
              '+351920000000',
            );

            expect(
              leadScoringService
                .calculateQuality,
            ).toHaveBeenCalled();

            expect(
              profileScoreService
                .updateUserScore,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );
          },
        );

        it(
          'should prevent manual MATCHED status',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            const dto:
              UpdateLeadDto = {
                status:
                  LeadStatus.MATCHED,
              };

            await expect(
              service.update(
                'lead-1',
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'MATCHED is managed automatically by the smart matching system',
            );

            expect(
              prisma.lead
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should prevent MATCHED lead from returning to NEW',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.MATCHED,
              });

            const dto:
              UpdateLeadDto = {
                status:
                  LeadStatus.NEW,
              };

            await expect(
              service.update(
                'lead-1',
                dto,
                buyerUser,
              ),
            ).rejects.toThrow(
              'A matched lead cannot be manually returned to NEW',
            );

            expect(
              prisma.lead
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should allow admin to update a lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.WARM,
              );

            prisma.lead
              .update
              .mockResolvedValue({
                ...baseLead,

                phone:
                  '+351930000000',

                quality:
                  LeadQuality.WARM,
              });

            const dto:
              UpdateLeadDto = {
                phone:
                  '+351930000000',
              };

            const result =
              await service.update(
                'lead-1',
                dto,
                adminUser,
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              prisma.lead
                .update,
            ).toHaveBeenCalled();
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
          'should delete buyer own lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            prisma.lead
              .delete
              .mockResolvedValue(
                baseLead,
              );

            const result =
              await service.remove(
                'lead-1',
                buyerUser,
              );

            expect(
              prisma.lead
                .delete,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'lead-1',
              },
            });

            expect(
              profileScoreService
                .updateUserScore,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual({
              message:
                'Lead deleted successfully',
            });
          },
        );

        it(
          'should allow admin to delete lead',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                baseLead,
              );

            prisma.lead
              .delete
              .mockResolvedValue(
                baseLead,
              );

            await service.remove(
              'lead-1',
              adminUser,
            );

            expect(
              prisma.lead
                .delete,
            ).toHaveBeenCalled();
          },
        );
      },
    );

    /*
     * ============================================================
     * MORTGAGE CALCULATOR
     * ============================================================
     */

    describe(
      'createFromCalculator',
      () => {
        it(
          'should reject non buyer users',
          async () => {
            await expect(
              service
                .createFromCalculator(
                  calculatorDto,
                  professionalUser,
                ),
            ).rejects.toThrow(
              'Only buyers can create calculator requests',
            );

            expect(
              prisma.user
                .findUnique,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should throw when buyer does not exist',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'Buyer not found',
            );
          },
        );

        it(
          'should create NEW buyer request and trigger automatic matching',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue(
                null,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.HOT,
              );

            prisma.lead
              .create
              .mockResolvedValue(
                baseLead,
              );

            autoMatchingService
              .matchLead
              .mockResolvedValue({
                matched:
                  true,

                professionalType:
                  'MORTGAGE_BROKER',

                threshold:
                  70,

                count:
                  1,

                matches: [
                  {
                    professionalId:
                      'professional-1',

                    score:
                      85,
                  },
                ],
              });

            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.MATCHED,

                matches: [
                  {
                    id:
                      'match-1',

                    score:
                      85,
                  },
                ],
              });

            const result =
              await service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                );

            expect(
              prisma.lead
                .create,
            ).toHaveBeenCalledWith({
              data:
                expect.objectContaining({
                  userId:
                    'buyer-1',

                  source:
                    'Mortgage Calculator',

                  interest:
                    'Mortgage / Property Purchase',

                  status:
                    LeadStatus.NEW,
                }),
            });

            expect(
              profileScoreService
                .updateUserScore,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              autoMatchingService
                .matchLead,
            ).toHaveBeenCalledWith(
              'lead-1',
            );

            expect(
              result.status,
            ).toBe(
              LeadStatus.MATCHED,
            );

            expect(
              result.alreadyExists,
            ).toBe(
              false,
            );

            /*
             * TypeScript-safe check.
             */
            expect(
              'autoMatching' in result,
            ).toBe(
              true,
            );

            if (
              'autoMatching' in
              result
            ) {
              expect(
                result.autoMatching,
              ).toEqual(
                expect.objectContaining({
                  matched:
                    true,

                  count:
                    1,
                }),
              );
            }
          },
        );

        it(
          'should update profile score after request creation',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue(
                null,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.WARM,
              );

            prisma.lead
              .create
              .mockResolvedValue(
                baseLead,
              );

            autoMatchingService
              .matchLead
              .mockResolvedValue({
                matched:
                  false,

                reason:
                  'NO_ELIGIBLE_PROFESSIONAL',

                matches:
                  [],
              });

            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                matches:
                  [],
              });

            await service
              .createFromCalculator(
                calculatorDto,
                buyerUser,
              );

            expect(
              profileScoreService
                .updateUserScore,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );
          },
        );

        it(
          'should not create duplicate when existing MATCHED request exists',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.MATCHED,
              });

            const result =
              await service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                );

            expect(
              result.alreadyExists,
            ).toBe(
              true,
            );

            expect(
              result.status,
            ).toBe(
              LeadStatus.MATCHED,
            );

            expect(
              prisma.lead
                .create,
            ).not
              .toHaveBeenCalled();

            expect(
              autoMatchingService
                .matchLead,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should retry automatic matching for existing NEW request',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.NEW,
              });

            autoMatchingService
              .matchLead
              .mockResolvedValue({
                matched:
                  true,

                professionalType:
                  'MORTGAGE_BROKER',

                threshold:
                  70,

                count:
                  1,

                matches:
                  [],
              });

            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.MATCHED,

                matches:
                  [],
              });

            const result =
              await service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                );

            expect(
              autoMatchingService
                .matchLead,
            ).toHaveBeenCalledWith(
              'lead-1',
            );

            expect(
              prisma.lead
                .create,
            ).not
              .toHaveBeenCalled();

            expect(
              result.alreadyExists,
            ).toBe(
              true,
            );

            expect(
              result.status,
            ).toBe(
              LeadStatus.MATCHED,
            );

            expect(
              'autoMatching' in result,
            ).toBe(
              true,
            );

            if (
              'autoMatching' in
              result
            ) {
              expect(
                result.autoMatching,
              ).toEqual(
                expect.objectContaining({
                  matched:
                    true,

                  count:
                    1,
                }),
              );
            }
          },
        );

        it(
          'should keep NEW request when no professional is available',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue(
                null,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.WARM,
              );

            prisma.lead
              .create
              .mockResolvedValue(
                baseLead,
              );

            autoMatchingService
              .matchLead
              .mockResolvedValue({
                matched:
                  false,

                reason:
                  'NO_ELIGIBLE_PROFESSIONAL',

                matches:
                  [],
              });

            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                status:
                  LeadStatus.NEW,

                matches:
                  [],
              });

            const result =
              await service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                );

            expect(
              result.status,
            ).toBe(
              LeadStatus.NEW,
            );

            expect(
              result.alreadyExists,
            ).toBe(
              false,
            );

            expect(
              'autoMatching' in result,
            ).toBe(
              true,
            );

            if (
              'autoMatching' in
              result
            ) {
              expect(
                result.autoMatching,
              ).toEqual(
                expect.objectContaining({
                  matched:
                    false,

                  reason:
                    'NO_ELIGIBLE_PROFESSIONAL',
                }),
              );
            }
          },
        );

        it(
          'should survive automatic matching exception',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue(
                null,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.HOT,
              );

            prisma.lead
              .create
              .mockResolvedValue(
                baseLead,
              );

            autoMatchingService
              .matchLead
              .mockRejectedValue(
                new Error(
                  'Matching unavailable',
                ),
              );

            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                matches:
                  [],
              });

            const result =
              await service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                );

            expect(
              result,
            ).toBeDefined();

            expect(
              result.alreadyExists,
            ).toBe(
              false,
            );

            expect(
              'autoMatching' in result,
            ).toBe(
              true,
            );

            if (
              'autoMatching' in
              result
            ) {
              expect(
                result.autoMatching,
              ).toBeNull();
            }
          },
        );

        it(
          'should throw if lead disappears after automatic matching',
          async () => {
            prisma.user
              .findUnique
              .mockResolvedValue(
                buyer,
              );

            prisma.lead
              .findFirst
              .mockResolvedValue(
                null,
              );

            leadScoringService
              .calculateQuality
              .mockReturnValue(
                LeadQuality.HOT,
              );

            prisma.lead
              .create
              .mockResolvedValue(
                baseLead,
              );

            autoMatchingService
              .matchLead
              .mockResolvedValue({
                matched:
                  false,

                reason:
                  'NO_ELIGIBLE_PROFESSIONAL',

                matches:
                  [],
              });

            prisma.lead
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service
                .createFromCalculator(
                  calculatorDto,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'Lead not found after automatic matching',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FIND MINE
     * ============================================================
     */

    describe(
      'findMine',
      () => {
        it(
          'should return authenticated buyer leads',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue([
                baseLead,
              ]);

            const result =
              await service.findMine(
                'buyer-1',
              );

            expect(
              result,
            ).toEqual([
              baseLead,
            ]);

            expect(
              prisma.lead
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  userId:
                    'buyer-1',
                },
              }),
            );
          },
        );

        it(
          'should order buyer requests newest first',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            await service.findMine(
              'buyer-1',
            );

            expect(
              prisma.lead
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
     * PROPERTY ALERTS
     * ============================================================
     */

    describe(
      'updatePropertyAlerts',
      () => {
        const propertySearchLead = {
          ...baseLead,

          source:
            'Property Search Assistant',

          searchText:
            'Apartment in Lisbon',

          isActive:
            true,

          notificationsEnabled:
            true,
        };

        it(
          'should reject non buyer user',
          async () => {
            await expect(
              service
                .updatePropertyAlerts(
                  'lead-1',
                  false,
                  professionalUser,
                ),
            ).rejects.toThrow(
              'Only buyers can manage property alerts.',
            );
          },
        );

        it(
          'should throw when request does not exist',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                null,
              );

            await expect(
              service
                .updatePropertyAlerts(
                  'missing-lead',
                  true,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'Buyer request not found.',
            );
          },
        );

        it(
          'should reject buyer modifying another buyer alerts',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...propertySearchLead,

                userId:
                  'buyer-2',
              });

            await expect(
              service
                .updatePropertyAlerts(
                  'lead-1',
                  true,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'You can only update your own property search.',
            );
          },
        );

        it(
          'should reject alerts for non property search request',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...baseLead,

                source:
                  'Mortgage Calculator',

                searchText:
                  null,
              });

            await expect(
              service
                .updatePropertyAlerts(
                  'lead-1',
                  true,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'Property alerts are only available for Property Search Assistant requests.',
            );
          },
        );

        it(
          'should reject property search request without searchText',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue({
                ...propertySearchLead,

                searchText:
                  null,
              });

            await expect(
              service
                .updatePropertyAlerts(
                  'lead-1',
                  true,
                  buyerUser,
                ),
            ).rejects.toThrow(
              'Property alerts are only available for Property Search Assistant requests.',
            );
          },
        );

        it(
          'should enable property alerts',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                propertySearchLead,
              );

            prisma.lead
              .update
              .mockResolvedValue({
                ...propertySearchLead,

                notificationsEnabled:
                  true,
              });

            const result =
              await service
                .updatePropertyAlerts(
                  'lead-1',
                  true,
                  buyerUser,
                );

            expect(
              prisma.lead
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'lead-1',
              },

              data: {
                notificationsEnabled:
                  true,
              },
            });

            expect(
              result,
            ).toEqual({
              id:
                'lead-1',

              isActive:
                true,

              notificationsEnabled:
                true,
            });
          },
        );

        it(
          'should disable property alerts',
          async () => {
            prisma.lead
              .findUnique
              .mockResolvedValue(
                propertySearchLead,
              );

            prisma.lead
              .update
              .mockResolvedValue({
                ...propertySearchLead,

                notificationsEnabled:
                  false,
              });

            const result =
              await service
                .updatePropertyAlerts(
                  'lead-1',
                  false,
                  buyerUser,
                );

            expect(
              prisma.lead
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'lead-1',
              },

              data: {
                notificationsEnabled:
                  false,
              },
            });

            expect(
              result
                .notificationsEnabled,
            ).toBe(
              false,
            );
          },
        );

      },
    );

describe('Property Search Assistant deduplication', () => {
  const searchDto = {
    searchText: 'Apartment in Lisbon with parking',
    location: 'Lisbon',
    budget: '€250000 - €350000',
    minBudget: 250000,
    maxBudget: 350000,
    minArea: 70,
    maxArea: 110,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    goal: 'buy',
    mustHave: ['Parking'],
  };

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(buyer);
    prisma.property.findMany.mockResolvedValue([]);
    prisma.lead.findFirst.mockResolvedValue(null);

    prisma.lead.create.mockResolvedValue({
      ...baseLead,
      id: 'new-search-lead',
      source: 'Property Search Assistant',
      status: LeadStatus.NEW,
    });

    prisma.lead.findUnique.mockResolvedValue({
      ...baseLead,
      id: 'new-search-lead',
      source: 'Property Search Assistant',
      status: LeadStatus.NEW,
      matches: [],
    });

    leadScoringService.calculateQuality.mockReturnValue(
      LeadQuality.HOT,
    );

    autoMatchingService.matchLead.mockResolvedValue({
      matched: false,
      count: 0,
    });

    profileScoreService.updateUserScore.mockResolvedValue(
      undefined,
    );
  });

  it('reuses an identical existing search', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      ...baseLead,
      id: 'existing-search-lead',
      status: LeadStatus.MATCHED,
    });

    const result = await service.createFromPropertySearch(
      searchDto,
      buyerUser,
    );

    expect(result.alreadyExists).toBe(true);
    expect(prisma.lead.create).not.toHaveBeenCalled();

    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          minBudget: 250000,
          maxBudget: 350000,
          minArea: 70,
          maxArea: 110,
          mustHave: {
            equals: ['Parking'],
          },
        }),
      }),
    );
  });

  it.each([
    ['minimum budget', { minBudget: 270000 }],
    ['maximum budget', { maxBudget: 320000 }],
    ['minimum area', { minArea: 85 }],
    ['maximum area', { maxArea: 95 }],
    ['equipment', { mustHave: ['Balcony'] }],
  ])(
    'creates a new search when %s differs',
    async (_criterion, changes) => {
      const dto = {
        ...searchDto,
        ...changes,
      };

      const result = await service.createFromPropertySearch(
        dto,
        buyerUser,
      );

      expect(result.alreadyExists).toBe(false);
      expect(prisma.lead.create).toHaveBeenCalledTimes(1);

      expect(prisma.lead.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            minBudget: dto.minBudget,
            maxBudget: dto.maxBudget,
            minArea: dto.minArea,
            maxArea: dto.maxArea,
            mustHave: {
              equals: dto.mustHave,
            },
          }),
        }),
      );
    },
  );
});

  },



);