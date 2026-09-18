import {
  LeadStatus,
  MatchStatus,
  ProfessionalType,
  VerificationStatus,
} from '@prisma/client';

import {
  AutoMatchingService,
} from './auto-matching.service';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  MatchingEngineService,
} from './matching-engine.service';

import {
  NotificationsService,
} from '../notifications/notifications.service';

describe(
  'AutoMatchingService',
  () => {
    let service:
      AutoMatchingService;

    /*
     * ==========================================================
     * PRISMA MOCKS
     * ==========================================================
     */

    const prismaMock = {
      lead: {
        findUnique:
          jest.fn(),

        update:
          jest.fn(),
      },

      professionalProfile: {
        findMany:
          jest.fn(),
      },

      match: {
        upsert:
          jest.fn(),
      },
    };

    /*
     * ==========================================================
     * MATCHING ENGINE MOCK
     * ==========================================================
     */

    const matchingEngineMock = {
      detectProfessionalType:
        jest.fn(),

      calculateDetailedScore:
        jest.fn(),
    };

    /*
     * ==========================================================
     * NOTIFICATIONS MOCK
     * ==========================================================
     */

    const notificationsServiceMock = {
      create:
        jest.fn(),
    };

    /*
     * ==========================================================
     * TEST DATA FACTORIES
     * ==========================================================
     */

    const createLead = (
      overrides: Record<
        string,
        unknown
      > = {},
    ) => ({
      id:
        'lead-1',

      userId:
        'buyer-1',

      fullName:
        'Test Buyer',

      email:
        'buyer@example.com',

      phone:
        null,

      source:
        'Affordability Calculator',

      interest:
        'Mortgage / Affordability Review',

      location:
        'Portugal',

      budget:
        '400000',

      propertyType:
        null,

      bedrooms:
        null,

      bathrooms:
        null,

      minBudget:
        null,

      maxBudget:
        null,

      goal:
        null,

      mustHave:
        [],

      searchText:
        null,

      aiSummary:
        null,

      confidence:
        null,

      isActive:
        true,

      notificationsEnabled:
        true,

      lastMatchedAt:
        null,

      quality:
        'WARM',

      status:
        LeadStatus.NEW,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),

      ...overrides,
    });

    const createProfessional = (
      id: string,

      score = 85,
    ) => ({
      id,

      userId:
        `user-${id}`,

      professionalType:
        ProfessionalType
          .MORTGAGE_BROKER,

      companyName:
        `Company ${id}`,

      bio:
        'Mortgage specialist in Portugal',

      languages: [
        'English',
      ],

      rating:
        4.8,

      reviewsCount:
        20,

      clientsCount:
        100,

      verificationStatus:
        VerificationStatus.ACTIVE,

      isFeatured:
        true,

      profileCompletion:
        95,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),

      user: {
        id:
          `user-${id}`,

        fullName:
          `Professional ${id}`,

        email:
          `${id}@example.com`,

        city:
          'Lisbon',

        country:
          'Portugal',

        avatarUrl:
          null,
      },

      /*
       * This field exists only
       * for easier test setup.
       */
      testScore:
        score,
    });

    /*
     * ==========================================================
     * BEFORE EACH
     * ==========================================================
     */

    beforeEach(() => {
      jest.clearAllMocks();

      service =
        new AutoMatchingService(
          prismaMock as unknown as
            PrismaService,

          matchingEngineMock as unknown as
            MatchingEngineService,

          notificationsServiceMock as unknown as
            NotificationsService,
        );

      matchingEngineMock
        .detectProfessionalType
        .mockReturnValue(
          ProfessionalType
            .MORTGAGE_BROKER,
        );

      notificationsServiceMock
        .create
        .mockResolvedValue(
          {},
        );

      prismaMock
        .lead
        .update
        .mockResolvedValue(
          {},
        );
    });

    /*
     * ==========================================================
     * LEAD VALIDATION
     * ==========================================================
     */

    describe(
      'lead validation',
      () => {
        it(
          'should return LEAD_NOT_FOUND when lead does not exist',
          async () => {
            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                null,
              );

            const result =
              await service.matchLead(
                'missing-lead',
              );

            expect(
              result.matched,
            ).toBe(false);

            expect(
              result.reason,
            ).toBe(
              'LEAD_NOT_FOUND',
            );

            expect(
              prismaMock
                .professionalProfile
                .findMany,
            ).not.toHaveBeenCalled();
          },
        );

        it(
          'should return LEAD_HAS_NO_BUYER when lead has no userId',
          async () => {
            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead({
                  userId:
                    null,
                }),
              );

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              result.matched,
            ).toBe(false);

            expect(
              result.reason,
            ).toBe(
              'LEAD_HAS_NO_BUYER',
            );
          },
        );
      },
    );

    /*
     * ==========================================================
     * PROFESSIONAL ELIGIBILITY
     * ==========================================================
     */

    describe(
      'professional eligibility',
      () => {
        it(
          'should search only ACTIVE professionals of the detected type',
          async () => {
            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            await service.matchLead(
              'lead-1',
            );

            expect(
              matchingEngineMock
                .detectProfessionalType,
            ).toHaveBeenCalled();

            expect(
              prismaMock
                .professionalProfile
                .findMany,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  professionalType:
                    ProfessionalType
                      .MORTGAGE_BROKER,

                  verificationStatus:
                    VerificationStatus
                      .ACTIVE,
                },
              }),
            );
          },
        );

        it(
          'should return NO_ELIGIBLE_PROFESSIONAL when none exists',
          async () => {
            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              result.matched,
            ).toBe(false);

            expect(
              result.reason,
            ).toBe(
              'NO_ELIGIBLE_PROFESSIONAL',
            );

            expect(
              result.professionalType,
            ).toBe(
              ProfessionalType
                .MORTGAGE_BROKER,
            );
          },
        );
      },
    );

    /*
     * ==========================================================
     * SCORE THRESHOLD
     * ==========================================================
     */

    describe(
      'matching threshold',
      () => {
        it(
          'should reject candidates below 70',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
                60,
              );

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  60,

                reasons: [
                  'Low compatibility',
                ],
              });

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              result.matched,
            ).toBe(false);

            expect(
              result.reason,
            ).toBe(
              'NO_CANDIDATE_ABOVE_THRESHOLD',
            );

            expect(
              prismaMock
                .match
                .upsert,
            ).not.toHaveBeenCalled();
          },
        );

        it(
          'should accept candidate exactly at threshold 70',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
                70,
              );

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  70,

                reasons: [
                  'Compatible',
                ],
              });

            prismaMock
              .match
              .upsert
              .mockResolvedValue({
                id:
                  'match-1',

                buyerId:
                  'buyer-1',

                professionalId:
                  'pro-1',

                leadId:
                  'lead-1',

                propertyId:
                  null,

                score:
                  70,

                status:
                  MatchStatus.ACTIVE,

                createdAt:
                  new Date(),

                updatedAt:
                  new Date(),

                professional,

                lead:
                  createLead(),
              });

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              result.matched,
            ).toBe(true);

            expect(
              result.count,
            ).toBe(1);
          },
        );
      },
    );

    /*
     * ==========================================================
     * AUTOMATIC MATCH CREATION
     * ==========================================================
     */

    describe(
      'automatic match creation',
      () => {
        it(
          'should create ACTIVE match without admin approval',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
                85,
              );

            const lead =
              createLead();

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                lead,
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  85,

                reasons: [
                  'Strong match',
                ],
              });

            prismaMock
              .match
              .upsert
              .mockResolvedValue({
                id:
                  'match-1',

                buyerId:
                  'buyer-1',

                leadId:
                  'lead-1',

                professionalId:
                  'pro-1',

                propertyId:
                  null,

                score:
                  85,

                status:
                  MatchStatus.ACTIVE,

                createdAt:
                  new Date(),

                updatedAt:
                  new Date(),

                professional,

                lead,
              });

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              prismaMock
                .match
                .upsert,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  leadId_professionalId: {
                    leadId:
                      'lead-1',

                    professionalId:
                      'pro-1',
                  },
                },

                update:
                  expect.objectContaining({
                    score:
                      85,

                    status:
                      MatchStatus.ACTIVE,
                  }),

                create:
                  expect.objectContaining({
                    buyerId:
                      'buyer-1',

                    leadId:
                      'lead-1',

                    professionalId:
                      'pro-1',

                    score:
                      85,

                    status:
                      MatchStatus.ACTIVE,
                  }),
              }),
            );

            expect(
              result.matched,
            ).toBe(true);

            expect(
              result.count,
            ).toBe(1);

            expect(
              result.threshold,
            ).toBe(70);
          },
        );

        it(
          'should update Lead status automatically to MATCHED',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
              );

            const lead =
              createLead();

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                lead,
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  90,

                reasons:
                  [],
              });

            prismaMock
              .match
              .upsert
              .mockResolvedValue({
                id:
                  'match-1',

                score:
                  90,

                status:
                  MatchStatus.ACTIVE,

                professional,

                lead,
              });

            await service.matchLead(
              'lead-1',
            );

            expect(
              prismaMock
                .lead
                .update,
            ).toHaveBeenCalledWith({
              where: {
                id:
                  'lead-1',
              },

              data: {
                status:
                  LeadStatus.MATCHED,
              },
            });
          },
        );
      },
    );

    /*
     * ==========================================================
     * TOP 3
     * ==========================================================
     */

    describe(
      'top three candidates',
      () => {
        it(
          'should create maximum 3 matches and select highest scores',
          async () => {
            const professionals = [
              createProfessional(
                'pro-1',
                72,
              ),

              createProfessional(
                'pro-2',
                95,
              ),

              createProfessional(
                'pro-3',
                80,
              ),

              createProfessional(
                'pro-4',
                90,
              ),
            ];

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue(
                professionals,
              );

            matchingEngineMock
              .calculateDetailedScore
              .mockImplementation(
                (
                  _lead,
                  professional,
                ) => ({
                  score:
                    professional
                      .testScore,

                  reasons:
                    [],
                }),
              );

            prismaMock
              .match
              .upsert
              .mockImplementation(
                async ({
                  create,
                }) => ({
                  id:
                    `match-${create.professionalId}`,

                  ...create,

                  professional:
                    professionals.find(
                      (item) =>
                        item.id ===
                        create.professionalId,
                    ),

                  lead:
                    createLead(),
                }),
              );

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              prismaMock
                .match
                .upsert,
            ).toHaveBeenCalledTimes(
              3,
            );

            expect(
              result.count,
            ).toBe(3);

            /*
             * Top scores:
             *
             * pro-2 = 95
             * pro-4 = 90
             * pro-3 = 80
             *
             * pro-1 = 72 excluded
             * because maximum = 3.
             */

            const firstCall =
              prismaMock
                .match
                .upsert
                .mock.calls[0][0];

            const secondCall =
              prismaMock
                .match
                .upsert
                .mock.calls[1][0];

            const thirdCall =
              prismaMock
                .match
                .upsert
                .mock.calls[2][0];

            expect(
              firstCall
                .create
                .professionalId,
            ).toBe(
              'pro-2',
            );

            expect(
              secondCall
                .create
                .professionalId,
            ).toBe(
              'pro-4',
            );

            expect(
              thirdCall
                .create
                .professionalId,
            ).toBe(
              'pro-3',
            );
          },
        );
      },
    );

    /*
     * ==========================================================
     * UPSERT / NO DUPLICATE
     * ==========================================================
     */

    describe(
      'duplicate protection',
      () => {
        it(
          'should use compound leadId + professionalId upsert key',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
              );

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  88,

                reasons:
                  [],
              });

            prismaMock
              .match
              .upsert
              .mockResolvedValue({
                id:
                  'existing-match',

                score:
                  88,

                status:
                  MatchStatus.ACTIVE,

                professional,

                lead:
                  createLead(),
              });

            await service.matchLead(
              'lead-1',
            );

            expect(
              prismaMock
                .match
                .upsert,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                where: {
                  leadId_professionalId: {
                    leadId:
                      'lead-1',

                    professionalId:
                      'pro-1',
                  },
                },
              }),
            );
          },
        );
      },
    );

    /*
     * ==========================================================
     * NOTIFICATIONS
     * ==========================================================
     */

    describe(
      'notifications',
      () => {
        it(
          'should notify professional and buyer after successful matching',
          async () => {
            const professional =
              createProfessional(
                'pro-1',
              );

            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                professional,
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  90,

                reasons:
                  [],
              });

            prismaMock
              .match
              .upsert
              .mockResolvedValue({
                id:
                  'match-1',

                score:
                  90,

                status:
                  MatchStatus.ACTIVE,

                professional,

                lead:
                  createLead(),
              });

            await service.matchLead(
              'lead-1',
            );

            /*
             * 1 notification:
             * professional
             *
             * 1 notification:
             * buyer
             */

            expect(
              notificationsServiceMock
                .create,
            ).toHaveBeenCalledTimes(
              2,
            );

            expect(
              notificationsServiceMock
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                userId:
                  'user-pro-1',

                title:
                  'New buyer match',
              }),
            );

            expect(
              notificationsServiceMock
                .create,
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                userId:
                  'buyer-1',

                title:
                  'Professionals matched to your request',
              }),
            );
          },
        );
      },
    );

    /*
     * ==========================================================
     * MATCH CREATION ERROR
     * ==========================================================
     */

    describe(
      'error handling',
      () => {
        it(
          'should return MATCH_CREATION_FAILED when all match creations fail',
          async () => {
            prismaMock
              .lead
              .findUnique
              .mockResolvedValue(
                createLead(),
              );

            prismaMock
              .professionalProfile
              .findMany
              .mockResolvedValue([
                createProfessional(
                  'pro-1',
                ),
              ]);

            matchingEngineMock
              .calculateDetailedScore
              .mockReturnValue({
                score:
                  90,

                reasons:
                  [],
              });

            prismaMock
              .match
              .upsert
              .mockRejectedValue(
                new Error(
                  'Database error',
                ),
              );

            const result =
              await service.matchLead(
                'lead-1',
              );

            expect(
              result.matched,
            ).toBe(false);

            expect(
              result.reason,
            ).toBe(
              'MATCH_CREATION_FAILED',
            );

            /*
             * Lead must NOT become MATCHED
             * if no Match was created.
             */

            expect(
              prismaMock
                .lead
                .update,
            ).not.toHaveBeenCalled();
          },
        );
      },
    );
  },
);