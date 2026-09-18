import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  ReviewsController,
} from './reviews.controller';

import {
  ReviewsService,
} from './reviews.service';

describe(
  'ReviewsController',
  () => {
    let controller:
      ReviewsController;

    let reviewsService: {
      create:
        jest.Mock;

      findByProfessional:
        jest.Mock;

      findMyReview:
        jest.Mock;

      findAll:
        jest.Mock;

      approve:
        jest.Mock;

      reject:
        jest.Mock;
    };

    beforeEach(
      async () => {
        reviewsService = {
          create:
            jest.fn(),

          findByProfessional:
            jest.fn(),

          findMyReview:
            jest.fn(),

          findAll:
            jest.fn(),

          approve:
            jest.fn(),

          reject:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              ReviewsController,
            ],

            providers: [
              {
                provide:
                  ReviewsService,

                useValue:
                  reviewsService,
              },
            ],
          }).compile();

        controller =
          module.get<ReviewsController>(
            ReviewsController,
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
  },
);