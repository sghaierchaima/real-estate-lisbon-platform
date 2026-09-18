import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  Role,
} from '@prisma/client';

import {
  MatchingController,
} from './matching.controller';

import {
  MatchingService,
} from './matching.service';

describe(
  'MatchingController',
  () => {
    let controller:
      MatchingController;

    let matchingService: {
      findAll:
        jest.Mock;

      findByBuyer:
        jest.Mock;

      contactProperty:
        jest.Mock;

      findByProfessionalUser:
        jest.Mock;

      markAsContacted:
        jest.Mock;

      markAsCompleted:
        jest.Mock;
    };

    const adminRequest = {
      user: {
        id:
          'admin-1',

        role:
          Role.ADMIN,
      },
    };

    const buyerRequest = {
      user: {
        id:
          'buyer-1',

        role:
          Role.BUYER,
      },
    };

    const professionalRequest = {
      user: {
        id:
          'professional-user-1',

        role:
          Role.PROFESSIONAL,
      },
    };

    beforeEach(
      async () => {
        matchingService = {
          findAll:
            jest.fn(),

          findByBuyer:
            jest.fn(),

          contactProperty:
            jest.fn(),

          findByProfessionalUser:
            jest.fn(),

          markAsContacted:
            jest.fn(),

          markAsCompleted:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              MatchingController,
            ],

            providers: [
              {
                provide:
                  MatchingService,

                useValue:
                  matchingService,
              },
            ],
          }).compile();

        controller =
          module.get<MatchingController>(
            MatchingController,
          );
      },
    );

    describe(
      'initialization',
      () => {
        it(
          'should be defined',
          () => {
            expect(
              controller,
            ).toBeDefined();
          },
        );
      },
    );

    /*
     * ============================================================
     * ADMIN
     * ============================================================
     */

    describe(
      'findAll',
      () => {
        it(
          'should call MatchingService.findAll with authenticated user',
          async () => {
            const matches = [
              {
                id:
                  'match-1',
              },
            ];

            matchingService
              .findAll
              .mockResolvedValue(
                matches,
              );

            const result =
              await controller.findAll(
                adminRequest as never,
              );

            expect(
              matchingService
                .findAll,
            ).toHaveBeenCalledWith(
              adminRequest.user,
            );

            expect(
              result,
            ).toEqual(
              matches,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * BUYER
     * ============================================================
     */

    describe(
      'findMyBuyerMatches',
      () => {
        it(
          'should return authenticated buyer matches',
          async () => {
            const matches = [
              {
                id:
                  'match-1',

                buyerId:
                  'buyer-1',
              },
            ];

            matchingService
              .findByBuyer
              .mockResolvedValue(
                matches,
              );

            const result =
              await controller
                .findMyBuyerMatches(
                  buyerRequest as never,
                );

            expect(
              matchingService
                .findByBuyer,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              matches,
            );
          },
        );
      },
    );

    describe(
      'contactProperty',
      () => {
        it(
          'should forward property id and authenticated buyer to service',
          async () => {
            const response = {
              alreadyExists:
                false,

              match: {
                id:
                  'match-1',
              },

              chatRoom: {
                id:
                  'room-1',
              },
            };

            matchingService
              .contactProperty
              .mockResolvedValue(
                response,
              );

            const result =
              await controller
                .contactProperty(
                  'property-1',
                  buyerRequest as never,
                );

            expect(
              matchingService
                .contactProperty,
            ).toHaveBeenCalledWith(
              'property-1',
              buyerRequest.user,
            );

            expect(
              result,
            ).toEqual(
              response,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROFESSIONAL
     * ============================================================
     */

    describe(
      'findMyProfessionalMatches',
      () => {
        it(
          'should return authenticated professional matches',
          async () => {
            const matches = [
              {
                id:
                  'match-1',

                professionalId:
                  'professional-profile-1',
              },
            ];

            matchingService
              .findByProfessionalUser
              .mockResolvedValue(
                matches,
              );

            const result =
              await controller
                .findMyProfessionalMatches(
                  professionalRequest as never,
                );

            expect(
              matchingService
                .findByProfessionalUser,
            ).toHaveBeenCalledWith(
              'professional-user-1',
            );

            expect(
              result,
            ).toEqual(
              matches,
            );
          },
        );
      },
    );

    describe(
      'markAsContacted',
      () => {
        it(
          'should forward match id and professional user to service',
          async () => {
            const updatedMatch = {
              id:
                'match-1',

              status:
                'CONTACTED',
            };

            matchingService
              .markAsContacted
              .mockResolvedValue(
                updatedMatch,
              );

            const result =
              await controller
                .markAsContacted(
                  'match-1',
                  professionalRequest as never,
                );

            expect(
              matchingService
                .markAsContacted,
            ).toHaveBeenCalledWith(
              'match-1',
              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual(
              updatedMatch,
            );
          },
        );
      },
    );

    describe(
      'markAsCompleted',
      () => {
        it(
          'should forward match id and professional user to service',
          async () => {
            const updatedMatch = {
              id:
                'match-1',

              status:
                'COMPLETED',
            };

            matchingService
              .markAsCompleted
              .mockResolvedValue(
                updatedMatch,
              );

            const result =
              await controller
                .markAsCompleted(
                  'match-1',
                  professionalRequest as never,
                );

            expect(
              matchingService
                .markAsCompleted,
            ).toHaveBeenCalledWith(
              'match-1',
              professionalRequest.user,
            );

            expect(
              result,
            ).toEqual(
              updatedMatch,
            );
          },
        );
      },
    );
  },
);