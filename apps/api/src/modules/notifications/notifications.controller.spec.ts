import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  NotificationsController,
} from './notifications.controller';

import {
  NotificationsService,
} from './notifications.service';

describe(
  'NotificationsController',
  () => {
    let controller:
      NotificationsController;

    let notificationsService: {
      create:
        jest.Mock;

      findAll:
        jest.Mock;

      unreadCount:
        jest.Mock;

      markAsRead:
        jest.Mock;

      markAllAsRead:
        jest.Mock;

      remove:
        jest.Mock;
    };

    beforeEach(
      async () => {
        notificationsService = {
          create:
            jest.fn(),

          findAll:
            jest.fn(),

          unreadCount:
            jest.fn(),

          markAsRead:
            jest.fn(),

          markAllAsRead:
            jest.fn(),

          remove:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              NotificationsController,
            ],

            providers: [
              {
                provide:
                  NotificationsService,

                useValue:
                  notificationsService,
              },
            ],
          }).compile();

        controller =
          module.get<NotificationsController>(
            NotificationsController,
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