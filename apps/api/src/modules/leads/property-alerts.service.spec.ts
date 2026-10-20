import {
  NotificationType,
  PropertyStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../../database/prisma.service';

import {
  PropertyAlertsService,
} from './property-alerts.service';

describe(
  'PropertyAlertsService',
  () => {
    let service:
      PropertyAlertsService;

    let prisma: {
      property: {
        findUnique:
          jest.Mock;
      };

      lead: {
        findMany:
          jest.Mock;

        update:
          jest.Mock;
      };

      notification: {
        findFirst:
          jest.Mock;

        create:
          jest.Mock;
      };


    };

    /*
     * ============================================================
     * FIXTURES
     * ============================================================
     */

    const publishedProperty = {
      id:
        'property-1',

      title:
        'Modern Apartment in Lisbon',

      status:
        PropertyStatus.PUBLISHED,

      location:
        'Lisbon',

      region:
        'Lisboa',

      city:
        'Lisbon',

            price:
        300000,

      area:
        90,

      propertyType:
        'Apartment',

      bedrooms:
        2,

      bathrooms:
        2,

      equipments: [
        'Balcony',
        'Elevator',
        'Parking',
      ],

      professionalProfile: {
        id:
          'professional-1',

        user: {
          id:
            'user-professional-1',
        },
      },
    };

    const matchingLead = {
      id:
        'lead-1',

      userId:
        'buyer-1',

      source:
        'Property Search Assistant',

      searchText:
        'Apartment in Lisbon',

      location:
        'Lisbon',

            minBudget:
        null,

      maxBudget:
        350000,

      minArea:
        null,

      maxArea:
        null,

      propertyType:
        'Apartment',



      bedrooms:
        2,

      bathrooms:
        1,

      mustHave: [
        'Balcony',
        'Parking',
      ],

      isActive:
        true,

      notificationsEnabled:
        true,

      lastMatchedAt:
        null,
    };

    /*
     * ============================================================
     * SETUP
     * ============================================================
     */

    beforeEach(
      () => {
        prisma = {
          property: {
            findUnique:
              jest.fn(),
          },

          lead: {
            findMany:
              jest.fn(),

            update:
              jest.fn(),
          },

          notification: {
            findFirst:
              jest.fn(),

            create:
              jest.fn(),
          },
        };

        service =
          new PropertyAlertsService(
            prisma as unknown as PrismaService,
          );
      },
    );

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
     * PROPERTY VALIDATION
     * ============================================================
     */

    describe(
      'property validation',
      () => {
        it(
          'should return zero when property does not exist',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                null,
              );

            const result =
              await service
                .checkNewProperty(
                  'missing-property',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                0,

              notificationsCreated:
                0,
            });

            expect(
              prisma.lead
                .findMany,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should return zero when property is not published',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                status:
                  PropertyStatus.DRAFT,
              });

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                0,

              notificationsCreated:
                0,
            });

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
     * SEARCH QUERY
     * ============================================================
     */

    describe(
      'eligible buyer searches',
      () => {
        it(
          'should load only active property search alerts',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            await service
              .checkNewProperty(
                'property-1',
              );

            expect(
              prisma.lead
                .findMany,
            ).toHaveBeenCalledWith({
              where: {
                source:
                  'Property Search Assistant',

                isActive:
                  true,

                notificationsEnabled:
                  true,

                userId: {
                  not:
                    null,
                },

                searchText: {
                  not:
                    null,
                },
              },
            });
          },
        );

        it(
          'should return zero when there are no active searches',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue(
                [],
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                0,

              notificationsCreated:
                0,
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * MATCHING
     * ============================================================
     */

    describe(
      'matching',
      () => {
        it(
          'should match a strongly compatible property',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue({
                ...matchingLead,

                lastMatchedAt:
                  new Date(),
              });

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );

            expect(
              result.notificationsCreated,
            ).toBe(
              1,
            );
          },
        );

        it(
          'should not match property below 70 percent',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                location:
                  'Porto',

                city:
                  'Porto',

                region:
                  'Porto',

                price:
                  700000,

                propertyType:
                  'Villa',

                bedrooms:
                  1,

                equipments:
                  [],
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                0,

              notificationsCreated:
                0,
            });

            expect(
              prisma.notification
                .findFirst,
            ).not
              .toHaveBeenCalled();

            expect(
              prisma.notification
                .create,
            ).not
              .toHaveBeenCalled();
          },
        );

        it(
          'should count matched search even when notification already exists',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue({
                id:
                  'existing-notification',
              });

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );

            expect(
              result.notificationsCreated,
            ).toBe(
              0,
            );

            expect(
              prisma.notification
                .create,
            ).not
              .toHaveBeenCalled();

            expect(
              prisma.lead
                .update,
            ).not
              .toHaveBeenCalled();
          },
        );
      },
    );

    /*
     * ============================================================
     * NOTIFICATION CREATION
     * ============================================================
     */

    describe(
      'notification creation',
      () => {
        it(
          'should check for duplicate notification first',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            await service
              .checkNewProperty(
                'property-1',
              );

            expect(
              prisma.notification
                .findFirst,
            ).toHaveBeenCalledWith({
              where: {
                userId:
                  'buyer-1',

                type:
                  NotificationType.PROPERTY_MATCH,

                propertyId:
                  'property-1',

                leadId:
                  'lead-1',
              },
            });
          },
        );

        it(
          'should create property match notification',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            await service
              .checkNewProperty(
                'property-1',
              );

            expect(
              prisma.notification
                .create,
            ).toHaveBeenCalledWith({
              data: {
                userId:
                  'buyer-1',

                type:
                  NotificationType.PROPERTY_MATCH,

                title:
                  'New property matches your search',

                message:
                  'Modern Apartment in Lisbon matches 100% of your saved property search.',

                propertyId:
                  'property-1',

                leadId:
                  'lead-1',
              },
            });
          },
        );

        it(
          'should update lastMatchedAt after creating notification',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            await service
              .checkNewProperty(
                'property-1',
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
                lastMatchedAt:
                  expect.any(
                    Date,
                  ),
              },
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * LOCATION
     * ============================================================
     */

    describe(
      'location matching',
      () => {
        it(
          'should match against city',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                location:
                  null,

                region:
                  null,

                city:
                  'Lisbon',
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    'Lisbon',

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );

        it(
          'should match against region',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                location:
                  null,

                city:
                  null,

                region:
                  'Lisboa',
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    'Lisboa',

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * BUDGET
     * ============================================================
     */

    describe(
      'budget matching',
      () => {
        it(
          'should match when property is within budget',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                price:
                  250000,
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    300000,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );

        it(
          'should not match when property exceeds only budget criterion',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                price:
                  500000,
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    300000,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROPERTY TYPE
     * ============================================================
     */

    describe(
      'property type matching',
      () => {
        it(
          'should match property type case-insensitively',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                propertyType:
                  'APARTMENT',
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    'apartment',

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * BEDROOMS
     * ============================================================
     */

    describe(
      'bedroom matching',
      () => {
        it(
          'should match when property has enough bedrooms',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                bedrooms:
                  3,
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    2,

                  mustHave:
                    [],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );

        it(
          'should not match when property has fewer bedrooms',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                bedrooms:
                  1,
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    2,

                  mustHave:
                    [],
                },
              ]);

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * MUST HAVE
     * ============================================================
     */

    describe(
      'must-have equipment matching',
      () => {
        it(
          'should fully match all requested equipment',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                equipments: [
                  'Balcony',
                  'Parking',
                ],
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave: [
                    'Balcony',
                    'Parking',
                  ],
                },
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              1,
            );
          },
        );

        it(
          'should not match with zero equipment compatibility when it is the only criterion',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue({
                ...publishedProperty,

                equipments: [
                  'Garage',
                ],
              });

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave: [
                    'Pool',
                    'Garden',
                  ],
                },
              ]);

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result.matchedSearches,
            ).toBe(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * NO CRITERIA
     * ============================================================
     */

    describe(
      'empty criteria',
      () => {
        it(
          'should not match when search has no matching criteria',
          async () => {
            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                {
                  ...matchingLead,

                  location:
                    null,

                  maxBudget:
                    null,

                  propertyType:
                    null,

                  bedrooms:
                    null,

                  mustHave:
                    [],
                },
              ]);

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                0,

              notificationsCreated:
                0,
            });
          },
        );
      },
    );

    /*
     * ============================================================
     * MULTIPLE SEARCHES
     * ============================================================
     */

    describe(
      'multiple searches',
      () => {
        it(
          'should create notifications for multiple matching buyers',
          async () => {
            const secondLead = {
              ...matchingLead,

              id:
                'lead-2',

              userId:
                'buyer-2',
            };

            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
                secondLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                2,

              notificationsCreated:
                2,
            });

            expect(
              prisma.notification
                .create,
            ).toHaveBeenCalledTimes(
              2,
            );

            expect(
              prisma.lead
                .update,
            ).toHaveBeenCalledTimes(
              2,
            );
          },
        );

        it(
          'should create notification only for searches above threshold',
          async () => {
            const badLead = {
              ...matchingLead,

              id:
                'lead-bad',

              userId:
                'buyer-bad',

              location:
                'Porto',

              maxBudget:
                100000,

              propertyType:
                'Villa',

              bedrooms:
                5,

              mustHave: [
                'Pool',
              ],
            };

            prisma.property
              .findUnique
              .mockResolvedValue(
                publishedProperty,
              );

            prisma.lead
              .findMany
              .mockResolvedValue([
                matchingLead,
                badLead,
              ]);

            prisma.notification
              .findFirst
              .mockResolvedValue(
                null,
              );

            prisma.notification
              .create
              .mockResolvedValue({
                id:
                  'notification-1',
              });

            prisma.lead
              .update
              .mockResolvedValue(
                matchingLead,
              );

            const result =
              await service
                .checkNewProperty(
                  'property-1',
                );

            expect(
              result,
            ).toEqual({
              matchedSearches:
                1,

              notificationsCreated:
                1,
            });
          },
        );
      },

    );

describe('hard budget and area constraints', () => {
  const checkWithLead = async (
    overrides: Record<string, unknown>,
    propertyOverrides: Record<string, unknown> = {},
  ) => {
    prisma.property.findUnique.mockResolvedValue({
      ...publishedProperty,
      ...propertyOverrides,
    });

    prisma.lead.findMany.mockResolvedValue([
      {
        ...matchingLead,
        ...overrides,
      },
    ]);

    prisma.notification.findFirst.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({ id: 'notification-1' });
    prisma.lead.update.mockResolvedValue({});

    return service.checkNewProperty('property-1');
  };

  it.each([
    ['below minimum budget', { minBudget: 350000 }],
    ['above maximum budget', { maxBudget: 250000 }],
    ['below minimum area', { minArea: 100 }],
    ['above maximum area', { maxArea: 80 }],
  ])('rejects property %s', async (_name, constraints) => {
    const result = await checkWithLead(constraints);

    expect(result).toEqual({
      matchedSearches: 0,
      notificationsCreated: 0,
    });

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('accepts property within all four constraints', async () => {
    const result = await checkWithLead({
      minBudget: 250000,
      maxBudget: 350000,
      minArea: 80,
      maxArea: 100,
    });

    expect(result.matchedSearches).toBe(1);
    expect(result.notificationsCreated).toBe(1);
  });

  it('rejects missing area when minimum area is required', async () => {
    const result = await checkWithLead(
      { minArea: 80 },
      { area: null },
    );

    expect(result.notificationsCreated).toBe(0);
    expect(result.matchedSearches).toBe(0);
  });
});

  },


);