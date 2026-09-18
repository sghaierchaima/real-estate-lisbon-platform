import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  StoriesController,
} from './stories.controller';

import {
  StoriesService,
} from './stories.service';

describe(
  'StoriesController',
  () => {
    let controller:
      StoriesController;

    const storiesServiceMock = {};

    beforeEach(
      async () => {
        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              StoriesController,
            ],

            providers: [
              {
                provide:
                  StoriesService,

                useValue:
                  storiesServiceMock,
              },
            ],
          }).compile();

        controller =
          module.get<StoriesController>(
            StoriesController,
          );
      },
    );

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