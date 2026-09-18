import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  StatsController,
} from './stats.controller';

import {
  StatsService,
} from './stats.service';

describe(
  'StatsController',
  () => {
    let controller:
      StatsController;

    let statsService: {
      getDashboardStats:
        jest.Mock;

      getRecentActivity:
        jest.Mock;

      getProfessionalDashboardStats:
        jest.Mock;

      getBuyerDashboardStats:
        jest.Mock;

      getAnalyticsDashboard:
        jest.Mock;
    };

    beforeEach(
      async () => {
        statsService = {
          getDashboardStats:
            jest.fn(),

          getRecentActivity:
            jest.fn(),

          getProfessionalDashboardStats:
            jest.fn(),

          getBuyerDashboardStats:
            jest.fn(),

          getAnalyticsDashboard:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              StatsController,
            ],

            providers: [
              {
                provide:
                  StatsService,

                useValue:
                  statsService,
              },
            ],
          }).compile();

        controller =
          module.get<StatsController>(
            StatsController,
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
              controller,
            ).toBeDefined();
          },
        );
      },
    );
  },
);