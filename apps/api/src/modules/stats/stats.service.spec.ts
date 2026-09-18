import {
  LeadQuality,
  MatchStatus,
  ProfessionalType,
  Role,
  StoryStatus,
  VerificationStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  StatsService,
} from './stats.service';

describe(
  'StatsService',
  () => {
    let service:
      StatsService;

    let prisma: {
      user: {
        count:
          jest.Mock;
      };

      professionalProfile: {
        count:
          jest.Mock;

        findUnique:
          jest.Mock;

        findMany:
          jest.Mock;
      };

      property: {
        count:
          jest.Mock;

        findMany:
          jest.Mock;
      };

      lead: {
        count:
          jest.Mock;

        findMany:
          jest.Mock;
      };

      match: {
        count:
          jest.Mock;

        findMany:
          jest.Mock;
      };

      story: {
        count:
          jest.Mock;
      };

      notification: {
        count:
          jest.Mock;
      };
    };

    /*
     * ============================================================
     * USERS
     * ============================================================
     */

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

    /*
     * ============================================================
     * SETUP
     * ============================================================
     */

    beforeEach(() => {
      prisma = {
        user: {
          count:
            jest.fn(),
        },

        professionalProfile: {
          count:
            jest.fn(),

          findUnique:
            jest.fn(),

          findMany:
            jest.fn(),
        },

        property: {
          count:
            jest.fn(),

          findMany:
            jest.fn(),
        },

        lead: {
          count:
            jest.fn(),

          findMany:
            jest.fn(),
        },

        match: {
          count:
            jest.fn(),

          findMany:
            jest.fn(),
        },

        story: {
          count:
            jest.fn(),
        },

        notification: {
          count:
            jest.fn(),
        },
      };

      service =
        new StatsService(
          prisma as unknown as PrismaService,
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
     * ADMIN DASHBOARD STATS
     * ============================================================
     */

    describe(
      'getDashboardStats',
      () => {
        it(
          'should return complete dashboard statistics',
          async () => {
            /*
             * user.count:
             *
             * totalUsers
             * totalBuyers
             */
            prisma.user
              .count
              .mockResolvedValueOnce(
                100,
              )
              .mockResolvedValueOnce(
                60,
              );

            /*
             * professionalProfile.count:
             *
             * totalProfessionals
             */
            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                20,
              );

            /*
             * property.count:
             *
             * totalProperties
             */
            prisma.property
              .count
              .mockResolvedValue(
                50,
              );

            /*
             * lead.count:
             *
             * totalLeads
             * matchedLeads
             * hotLeads
             */
            prisma.lead
              .count
              .mockResolvedValueOnce(
                40,
              )
              .mockResolvedValueOnce(
                25,
              )
              .mockResolvedValueOnce(
                12,
              );

            /*
             * match.count:
             *
             * total
             * pending
             * active
             * contacted
             * completed
             * cancelled
             */
            prisma.match
              .count
              .mockResolvedValueOnce(
                30,
              )
              .mockResolvedValueOnce(
                2,
              )
              .mockResolvedValueOnce(
                10,
              )
              .mockResolvedValueOnce(
                6,
              )
              .mockResolvedValueOnce(
                10,
              )
              .mockResolvedValueOnce(
                2,
              );

            /*
             * story.count:
             *
             * pending
             * approved
             */
            prisma.story
              .count
              .mockResolvedValueOnce(
                3,
              )
              .mockResolvedValueOnce(
                8,
              );

            const result =
              await service
                .getDashboardStats();

            expect(
              result,
            ).toEqual({
              users: {
                total:
                  100,

                buyers:
                  60,

                professionals:
                  20,
              },

              properties: {
                total:
                  50,
              },

              leads: {
                total:
                  40,

                matched:
                  25,

                hot:
                  12,
              },

              matching: {
                total:
                  30,

                pending:
                  2,

                active:
                  10,

                contacted:
                  6,

                completed:
                  10,

                cancelled:
                  2,
              },

              stories: {
                pending:
                  3,

                approved:
                  8,
              },
            });
          },
        );

        it(
          'should request buyer count using BUYER role',
          async () => {
            prisma.user
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.property
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.story
              .count
              .mockResolvedValue(
                0,
              );

            await service
              .getDashboardStats();

            expect(
              prisma.user.count,
            ).toHaveBeenCalledWith({
              where: {
                role:
                  Role.BUYER,
              },
            });
          },
        );

        it(
          'should count matched leads using matches relation',
          async () => {
            prisma.user
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.property
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.story
              .count
              .mockResolvedValue(
                0,
              );

            await service
              .getDashboardStats();

            expect(
              prisma.lead.count,
            ).toHaveBeenCalledWith({
              where: {
                matches: {
                  some: {},
                },
              },
            });
          },
        );

        it(
          'should count HOT leads',
          async () => {
            prisma.user
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.property
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.story
              .count
              .mockResolvedValue(
                0,
              );

            await service
              .getDashboardStats();

            expect(
              prisma.lead.count,
            ).toHaveBeenCalledWith({
              where: {
                quality:
                  LeadQuality.HOT,
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * RECENT ACTIVITY
     * ============================================================
     */

    describe(
      'getRecentActivity',
      () => {
        it(
          'should merge leads matches and properties and sort newest first',
          async () => {
            const leadDate =
              new Date(
                '2026-08-31T10:00:00.000Z',
              );

            const matchDate =
              new Date(
                '2026-08-31T12:00:00.000Z',
              );

            const propertyDate =
              new Date(
                '2026-08-31T11:00:00.000Z',
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'lead-1',

                  fullName:
                    'John Buyer',

                  email:
                    'john@example.com',

                  source:
                    'Mortgage Calculator',

                  interest:
                    'Mortgage',

                  createdAt:
                    leadDate,
                },
              ]);

            prisma.match
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'match-1',

                  status:
                    MatchStatus.ACTIVE,

                  score:
                    90,

                  createdAt:
                    matchDate,

                  lead: {
                    fullName:
                      'Maria Buyer',

                    email:
                      'maria@example.com',
                  },

                  professional: {
                    companyName:
                      'Lisbon Realty',

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    user: {
                      fullName:
                        'Ana Costa',
                    },
                  },
                },
              ]);

            prisma.property
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'property-1',

                  title:
                    'Lisbon Apartment',

                  status:
                    'PUBLISHED',

                  city:
                    'Lisbon',

                  createdAt:
                    propertyDate,
                },
              ]);

            const result =
              await service
                .getRecentActivity();

            expect(
              result,
            ).toHaveLength(
              3,
            );

            /*
             * Match = 12:00
             * Property = 11:00
             * Lead = 10:00
             */
            expect(
              result[0].id,
            ).toBe(
              'match-match-1',
            );

            expect(
              result[1].id,
            ).toBe(
              'property-property-1',
            );

            expect(
              result[2].id,
            ).toBe(
              'lead-lead-1',
            );
          },
        );

        it(
          'should generate lead activity description',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'lead-1',

                  fullName:
                    'John Buyer',

                  email:
                    'john@example.com',

                  source:
                    'Affordability Calculator',

                  interest:
                    null,

                  createdAt:
                    new Date(),
                },
              ]);

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.property
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service
                .getRecentActivity();

            expect(
              result[0],
            ).toEqual(
              expect.objectContaining({
                id:
                  'lead-lead-1',

                type:
                  'LEAD',

                title:
                  'John Buyer',

                description:
                  'Created from Affordability Calculator',
              }),
            );
          },
        );

        it(
          'should generate property activity description with city',
          async () => {
            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.property
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'property-1',

                  title:
                    'Lisbon Apartment',

                  status:
                    'PUBLISHED',

                  city:
                    'Lisbon',

                  createdAt:
                    new Date(),
                },
              ]);

            const result =
              await service
                .getRecentActivity();

            expect(
              result[0].description,
            ).toBe(
              'Property published in Lisbon',
            );
          },
        );

        it(
          'should limit activity feed to eight entries',
          async () => {
            const leads =
              Array.from(
                {
                  length:
                    5,
                },

                (
                  _,
                  index,
                ) => ({
                  id:
                    `lead-${index}`,

                  fullName:
                    `Buyer ${index}`,

                  email:
                    null,

                  source:
                    'Platform',

                  interest:
                    null,

                  createdAt:
                    new Date(
                      2026,
                      7,
                      31,
                      10,
                      index,
                    ),
                }),
              );

            const matches =
              Array.from(
                {
                  length:
                    5,
                },

                (
                  _,
                  index,
                ) => ({
                  id:
                    `match-${index}`,

                  status:
                    MatchStatus.ACTIVE,

                  score:
                    80,

                  createdAt:
                    new Date(
                      2026,
                      7,
                      31,
                      11,
                      index,
                    ),

                  lead: {
                    fullName:
                      `Buyer ${index}`,

                    email:
                      null,
                  },

                  professional: {
                    companyName:
                      'Company',

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    user: {
                      fullName:
                        'Agent',
                    },
                  },
                }),
              );

            const properties =
              Array.from(
                {
                  length:
                    5,
                },

                (
                  _,
                  index,
                ) => ({
                  id:
                    `property-${index}`,

                  title:
                    `Property ${index}`,

                  status:
                    'PUBLISHED',

                  city:
                    'Lisbon',

                  createdAt:
                    new Date(
                      2026,
                      7,
                      31,
                      12,
                      index,
                    ),
                }),
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                leads,
              );

            prisma.match
              .findMany
              .mockResolvedValue(
                matches,
              );

            prisma.property
              .findMany
              .mockResolvedValue(
                properties,
              );

            const result =
              await service
                .getRecentActivity();

            expect(
              result,
            ).toHaveLength(
              8,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROFESSIONAL DASHBOARD
     * ============================================================
     */

    describe(
      'getProfessionalDashboardStats',
      () => {
        it(
          'should return empty dashboard when profile does not exist',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue(
                null,
              );

            const result =
              await service
                .getProfessionalDashboardStats(
                  professionalUser,
                );

            expect(
              result,
            ).toEqual({
              profile:
                null,

              matches: {
                total:
                  0,

                pending:
                  0,

                active:
                  0,

                contacted:
                  0,

                completed:
                  0,

                cancelled:
                  0,
              },

              properties: {
                total:
                  0,

                published:
                  0,

                draft:
                  0,
              },

              notifications: {
                unread:
                  0,
              },
            });

            expect(
              prisma.match
                .count,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should return professional dashboard statistics',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                id:
                  'profile-1',

                userId:
                  'professional-user-1',

                professionalType:
                  ProfessionalType.PROPERTY_AGENT,

                verificationStatus:
                  VerificationStatus.ACTIVE,

                profileCompletion:
                  95,
              });

            /*
             * Match counters
             */
            prisma.match
              .count
              .mockResolvedValueOnce(
                20,
              )
              .mockResolvedValueOnce(
                1,
              )
              .mockResolvedValueOnce(
                7,
              )
              .mockResolvedValueOnce(
                4,
              )
              .mockResolvedValueOnce(
                6,
              )
              .mockResolvedValueOnce(
                2,
              );

            /*
             * Property counters
             */
            prisma.property
              .count
              .mockResolvedValueOnce(
                10,
              )
              .mockResolvedValueOnce(
                7,
              )
              .mockResolvedValueOnce(
                3,
              );

            prisma.notification
              .count
              .mockResolvedValue(
                5,
              );

            const result =
              await service
                .getProfessionalDashboardStats(
                  professionalUser,
                );

            expect(
              result.profile,
            ).toEqual({
              id:
                'profile-1',

              professionalType:
                ProfessionalType.PROPERTY_AGENT,

              verificationStatus:
                VerificationStatus.ACTIVE,

              profileCompletion:
                95,

              isPropertyAgent:
                true,
            });

            expect(
              result.matches,
            ).toEqual({
              total:
                20,

              pending:
                1,

              active:
                7,

              contacted:
                4,

              completed:
                6,

              cancelled:
                2,
            });

            expect(
              result.properties,
            ).toEqual({
              total:
                10,

              published:
                7,

              draft:
                3,
            });

            expect(
              result.notifications,
            ).toEqual({
              unread:
                5,
            });
          },
        );

        it(
          'should identify non property agent professional',
          async () => {
            prisma
              .professionalProfile
              .findUnique
              .mockResolvedValue({
                id:
                  'profile-1',

                professionalType:
                  ProfessionalType.MORTGAGE_BROKER,

                verificationStatus:
                  VerificationStatus.ACTIVE,

                profileCompletion:
                  90,
              });

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.property
              .count
              .mockResolvedValue(
                0,
              );

            prisma.notification
              .count
              .mockResolvedValue(
                0,
              );

            const result =
              await service
                .getProfessionalDashboardStats(
                  professionalUser,
                );

            expect(
              result.profile
                ?.isPropertyAgent,
            ).toBe(
              false,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * BUYER DASHBOARD
     * ============================================================
     */

    describe(
      'getBuyerDashboardStats',
      () => {
        it(
          'should return buyer dashboard statistics',
          async () => {
            /*
             * Lead counts:
             *
             * total
             * hot
             */
            prisma.lead
              .count
              .mockResolvedValueOnce(
                8,
              )
              .mockResolvedValueOnce(
                3,
              );

            /*
             * Match counts:
             *
             * total
             * pending
             * active
             * contacted
             * completed
             */
            prisma.match
              .count
              .mockResolvedValueOnce(
                6,
              )
              .mockResolvedValueOnce(
                1,
              )
              .mockResolvedValueOnce(
                2,
              )
              .mockResolvedValueOnce(
                1,
              )
              .mockResolvedValueOnce(
                2,
              );

            prisma.notification
              .count
              .mockResolvedValue(
                4,
              );

            const result =
              await service
                .getBuyerDashboardStats(
                  buyerUser,
                );

            expect(
              result,
            ).toEqual({
              leads: {
                total:
                  8,

                hot:
                  3,
              },

              matches: {
                total:
                  6,

                pending:
                  1,

                active:
                  2,

                contacted:
                  1,

                completed:
                  2,
              },

              notifications: {
                unread:
                  4,
              },
            });
          },
        );

        it(
          'should scope lead counts to authenticated buyer',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.notification
              .count
              .mockResolvedValue(
                0,
              );

            await service
              .getBuyerDashboardStats(
                buyerUser,
              );

            expect(
              prisma.lead.count,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',
              },
            });

            expect(
              prisma.lead.count,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                quality:
                  LeadQuality.HOT,
              },
            });
          },
        );

        it(
          'should scope notifications to authenticated buyer',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma.notification
              .count
              .mockResolvedValue(
                0,
              );

            await service
              .getBuyerDashboardStats(
                buyerUser,
              );

            expect(
              prisma.notification
                .count,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                isRead:
                  false,
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * ANALYTICS DASHBOARD
     * ============================================================
     */

    describe(
      'getAnalyticsDashboard',
      () => {
        it(
          'should calculate complete analytics dashboard',
          async () => {
            /*
             * Lead counts:
             *
             * total
             * matched
             * hot
             * warm
             * cold
             */
            prisma.lead
              .count
              .mockResolvedValueOnce(
                10,
              )
              .mockResolvedValueOnce(
                6,
              )
              .mockResolvedValueOnce(
                4,
              )
              .mockResolvedValueOnce(
                3,
              )
              .mockResolvedValueOnce(
                3,
              );

            /*
             * Match counts:
             *
             * total
             * completed
             * contacted
             * active
             * pending
             * cancelled
             */
            prisma.match
              .count
              .mockResolvedValueOnce(
                8,
              )
              .mockResolvedValueOnce(
                4,
              )
              .mockResolvedValueOnce(
                1,
              )
              .mockResolvedValueOnce(
                2,
              )
              .mockResolvedValueOnce(
                1,
              )
              .mockResolvedValueOnce(
                0,
              );

            /*
             * Professionals
             */
            prisma
              .professionalProfile
              .count
              .mockResolvedValueOnce(
                5,
              )
              .mockResolvedValueOnce(
                4,
              );

            /*
             * Lead details
             */
            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'lead-1',

                  source:
                    'Mortgage Calculator',

                  quality:
                    LeadQuality.HOT,

                  status:
                    'MATCHED',

                  createdAt:
                    new Date(),
                },

                {
                  id:
                    'lead-2',

                  source:
                    'Mortgage Calculator',

                  quality:
                    LeadQuality.WARM,

                  status:
                    'NEW',

                  createdAt:
                    new Date(),
                },

                {
                  id:
                    'lead-3',

                  source:
                    'Property Search Assistant',

                  quality:
                    LeadQuality.COLD,

                  status:
                    'NEW',

                  createdAt:
                    new Date(),
                },
              ]);

            /*
             * Match details
             */
            prisma.match
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'match-1',

                  status:
                    MatchStatus.ACTIVE,

                  score:
                    80,

                  createdAt:
                    new Date(),

                  professional: {
                    id:
                      'profile-1',

                    companyName:
                      'Lisbon Realty',

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    user: {
                      fullName:
                        'Ana Costa',
                    },
                  },
                },

                {
                  id:
                    'match-2',

                  status:
                    MatchStatus.COMPLETED,

                  score:
                    90,

                  createdAt:
                    new Date(),

                  professional: {
                    id:
                      'profile-2',

                    companyName:
                      'Finance Portugal',

                    professionalType:
                      ProfessionalType.MORTGAGE_BROKER,

                    user: {
                      fullName:
                        'Carlos Silva',
                    },
                  },
                },
              ]);

            /*
             * Top professionals
             */
            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'profile-1',

                  companyName:
                    'Lisbon Realty',

                  professionalType:
                    ProfessionalType.PROPERTY_AGENT,

                  rating:
                    4.9,

                  verificationStatus:
                    VerificationStatus.ACTIVE,

                  user: {
                    fullName:
                      'Ana Costa',
                  },

                  matches: [
                    {
                      id:
                        'match-completed-1',
                    },

                    {
                      id:
                        'match-completed-2',
                    },
                  ],
                },
              ]);

            const result =
              await service
                .getAnalyticsDashboard();

            expect(
              result.totals,
            ).toEqual({
              leads:
                10,

              matchedLeads:
                6,

              matches:
                8,

              professionals:
                5,

              activeProfessionals:
                4,

              /*
               * (80 + 90) / 2 = 85
               */
              averageMatchScore:
                85,

              /*
               * 6 / 10 = 60%
               */
              conversionRate:
                60,

              /*
               * 4 / 8 = 50%
               */
              completionRate:
                50,
            });

            expect(
              result.leadsQuality,
            ).toEqual({
              hot:
                4,

              warm:
                3,

              cold:
                3,
            });

            expect(
              result.matchesStatus,
            ).toEqual({
              pending:
                1,

              active:
                2,

              contacted:
                1,

              completed:
                4,

              cancelled:
                0,
            });
          },
        );

        it(
          'should group leads by source',
          async () => {
            /*
             * All counters can be zero for this test.
             */
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'lead-1',

                  source:
                    'Mortgage Calculator',

                  quality:
                    LeadQuality.HOT,

                  status:
                    'NEW',

                  createdAt:
                    new Date(),
                },

                {
                  id:
                    'lead-2',

                  source:
                    'Mortgage Calculator',

                  quality:
                    LeadQuality.WARM,

                  status:
                    'NEW',

                  createdAt:
                    new Date(),
                },

                {
                  id:
                    'lead-3',

                  source:
                    'True Cost Calculator',

                  quality:
                    LeadQuality.COLD,

                  status:
                    'NEW',

                  createdAt:
                    new Date(),
                },
              ]);

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service
                .getAnalyticsDashboard();

            expect(
              result.leadsBySource,
            ).toEqual([
              {
                source:
                  'Mortgage Calculator',

                total:
                  2,
              },

              {
                source:
                  'True Cost Calculator',

                total:
                  1,
              },
            ]);
          },
        );

        it(
          'should group matches by status',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.match
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'match-1',

                  status:
                    MatchStatus.ACTIVE,

                  score:
                    80,

                  createdAt:
                    new Date(),

                  professional: {
                    id:
                      'profile-1',

                    companyName:
                      null,

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    user: {
                      fullName:
                        'Agent',
                    },
                  },
                },

                {
                  id:
                    'match-2',

                  status:
                    MatchStatus.ACTIVE,

                  score:
                    90,

                  createdAt:
                    new Date(),

                  professional: {
                    id:
                      'profile-1',

                    companyName:
                      null,

                    professionalType:
                      ProfessionalType.PROPERTY_AGENT,

                    user: {
                      fullName:
                        'Agent',
                    },
                  },
                },

                {
                  id:
                    'match-3',

                  status:
                    MatchStatus.COMPLETED,

                  score:
                    85,

                  createdAt:
                    new Date(),

                  professional: {
                    id:
                      'profile-2',

                    companyName:
                      null,

                    professionalType:
                      ProfessionalType.MORTGAGE_BROKER,

                    user: {
                      fullName:
                        'Broker',
                    },
                  },
                },
              ]);

            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service
                .getAnalyticsDashboard();

            expect(
              result.matchesByStatus,
            ).toEqual([
              {
                status:
                  MatchStatus.ACTIVE,

                total:
                  2,
              },

              {
                status:
                  MatchStatus.COMPLETED,

                total:
                  1,
              },
            ]);
          },
        );

        it(
          'should calculate zero rates when there are no leads or matches',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service
                .getAnalyticsDashboard();

            expect(
              result.totals
                .averageMatchScore,
            ).toBe(
              0,
            );

            expect(
              result.totals
                .conversionRate,
            ).toBe(
              0,
            );

            expect(
              result.totals
                .completionRate,
            ).toBe(
              0,
            );
          },
        );

        it(
          'should map top professional statistics',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue([
                {
                  id:
                    'profile-1',

                  companyName:
                    'Lisbon Realty',

                  professionalType:
                    ProfessionalType.PROPERTY_AGENT,

                  rating:
                    4.8,

                  verificationStatus:
                    VerificationStatus.ACTIVE,

                  user: {
                    fullName:
                      'Ana Costa',
                  },

                  matches: [
                    {
                      id:
                        'match-1',
                    },

                    {
                      id:
                        'match-2',
                    },

                    {
                      id:
                        'match-3',
                    },
                  ],
                },
              ]);

            const result =
              await service
                .getAnalyticsDashboard();

            expect(
              result.topProfessionals,
            ).toEqual([
              {
                id:
                  'profile-1',

                name:
                  'Ana Costa',

                companyName:
                  'Lisbon Realty',

                professionalType:
                  ProfessionalType.PROPERTY_AGENT,

                rating:
                  4.8,

                completedMatches:
                  3,

                verificationStatus:
                  VerificationStatus.ACTIVE,
              },
            ]);
          },
        );

        it(
          'should request only ACTIVE professionals for active count',
          async () => {
            prisma.lead
              .count
              .mockResolvedValue(
                0,
              );

            prisma.match
              .count
              .mockResolvedValue(
                0,
              );

            prisma
              .professionalProfile
              .count
              .mockResolvedValue(
                0,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma.match
              .findMany
              .mockResolvedValue(
                [],
              );

            prisma
              .professionalProfile
              .findMany
              .mockResolvedValue(
                [],
              );

            await service
              .getAnalyticsDashboard();

            expect(
              prisma
                .professionalProfile
                .count,
            ).toHaveBeenCalledWith({
              where: {
                verificationStatus:
                  'ACTIVE',
              },
            });
          },
        );
      },
    );
  },
);