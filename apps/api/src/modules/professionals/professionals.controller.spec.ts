import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  ProfessionalType,
  Role,
} from '@prisma/client';

import {
  ProfessionalsController,
} from './professionals.controller';

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
  'ProfessionalsController',
  () => {
    let controller:
      ProfessionalsController;

    let professionalsService: {
      findPublicByType:
        jest.Mock;

      findAll:
        jest.Mock;

      findPending:
        jest.Mock;

      findMe:
        jest.Mock;

      updateMe:
        jest.Mock;

      getMyApplication:
        jest.Mock;

      findOne:
        jest.Mock;

      approve:
        jest.Mock;

      reject:
        jest.Mock;

      create:
        jest.Mock;

      findPublicOne:
        jest.Mock;

      apply:
        jest.Mock;
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
        professionalsService = {
          findPublicByType:
            jest.fn(),

          findAll:
            jest.fn(),

          findPending:
            jest.fn(),

          findMe:
            jest.fn(),

          updateMe:
            jest.fn(),

          getMyApplication:
            jest.fn(),

          findOne:
            jest.fn(),

          approve:
            jest.fn(),

          reject:
            jest.fn(),

          create:
            jest.fn(),

          findPublicOne:
            jest.fn(),

          apply:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              ProfessionalsController,
            ],

            providers: [
              {
                provide:
                  ProfessionalsService,

                useValue:
                  professionalsService,
              },
            ],
          }).compile();

        controller =
          module.get<ProfessionalsController>(
            ProfessionalsController,
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

    describe(
      'findPublic',
      () => {
        it(
          'should return public professionals without type filter',
          async () => {
            const resultData = [
              {
                id:
                  'professional-1',
              },
            ];

            professionalsService
              .findPublicByType
              .mockResolvedValue(
                resultData,
              );

            const result =
              await controller
                .findPublic();

            expect(
              professionalsService
                .findPublicByType,
            ).toHaveBeenCalledWith(
              undefined,
            );

            expect(
              result,
            ).toEqual(
              resultData,
            );
          },
        );

        it(
          'should forward professional type filter',
          async () => {
            professionalsService
              .findPublicByType
              .mockResolvedValue(
                [],
              );

            await controller
              .findPublic(
                ProfessionalType
                  .MORTGAGE_BROKER,
              );

            expect(
              professionalsService
                .findPublicByType,
            ).toHaveBeenCalledWith(
              ProfessionalType
                .MORTGAGE_BROKER,
            );
          },
        );
      },
    );

    describe(
      'findAll',
      () => {
        it(
          'should delegate to ProfessionalsService.findAll',
          async () => {
            const professionals = [
              {
                id:
                  'professional-1',
              },
            ];

            professionalsService
              .findAll
              .mockResolvedValue(
                professionals,
              );

            const result =
              await controller
                .findAll();

            expect(
              professionalsService
                .findAll,
            ).toHaveBeenCalledTimes(
              1,
            );

            expect(
              result,
            ).toEqual(
              professionals,
            );
          },
        );
      },
    );

    describe(
      'findPending',
      () => {
        it(
          'should delegate to ProfessionalsService.findPending',
          async () => {
            professionalsService
              .findPending
              .mockResolvedValue([
                {
                  id:
                    'professional-1',
                },
              ]);

            const result =
              await controller
                .findPending();

            expect(
              professionalsService
                .findPending,
            ).toHaveBeenCalledTimes(
              1,
            );

            expect(
              result,
            ).toHaveLength(
              1,
            );
          },
        );
      },
    );

    describe(
      'findMe',
      () => {
        it(
          'should return authenticated professional profile',
          async () => {
            const profile = {
              id:
                'professional-1',

              userId:
                'professional-user-1',
            };

            professionalsService
              .findMe
              .mockResolvedValue(
                profile,
              );

            const result =
              await controller
                .findMe(
                  professionalRequest as never,
                );

            expect(
              professionalsService
                .findMe,
            ).toHaveBeenCalledWith(
              'professional-user-1',
            );

            expect(
              result,
            ).toEqual(
              profile,
            );
          },
        );
      },
    );

    describe(
      'updateMe',
      () => {
        it(
          'should forward authenticated user and dto',
          async () => {
            const dto = {
              companyName:
                'Lisbon Realty',

              professionalType:
                ProfessionalType
                  .PROPERTY_AGENT,

              bio:
                'Property specialist',

              languages: [
                'English',
              ],
            };

            const updated = {
              id:
                'professional-1',

              ...dto,
            };

            professionalsService
              .updateMe
              .mockResolvedValue(
                updated,
              );

            const result =
              await controller
                .updateMe(
                  professionalRequest as never,
                  dto,
                );

            expect(
              professionalsService
                .updateMe,
            ).toHaveBeenCalledWith(
              'professional-user-1',
              dto,
            );

            expect(
              result,
            ).toEqual(
              updated,
            );
          },
        );
      },
    );

    describe(
      'getMyApplication',
      () => {
        it(
          'should return authenticated user application',
          async () => {
            const application = {
              role:
                Role.BUYER,

              professionalProfile: {
                id:
                  'professional-1',
              },
            };

            professionalsService
              .getMyApplication
              .mockResolvedValue(
                application,
              );

            const result =
              await controller
                .getMyApplication(
                  buyerRequest as never,
                );

            expect(
              professionalsService
                .getMyApplication,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              application,
            );
          },
        );
      },
    );

    describe(
      'findOne',
      () => {
        it(
          'should return professional by id',
          async () => {
            const professional = {
              id:
                'professional-1',
            };

            professionalsService
              .findOne
              .mockResolvedValue(
                professional,
              );

            const result =
              await controller
                .findOne(
                  'professional-1',
                );

            expect(
              professionalsService
                .findOne,
            ).toHaveBeenCalledWith(
              'professional-1',
            );

            expect(
              result,
            ).toEqual(
              professional,
            );
          },
        );
      },
    );

    describe(
      'approve',
      () => {
        it(
          'should approve professional by id',
          async () => {
            const approved = {
              id:
                'professional-1',

              verificationStatus:
                'ACTIVE',
            };

            professionalsService
              .approve
              .mockResolvedValue(
                approved,
              );

            const result =
              await controller
                .approve(
                  'professional-1',
                );

            expect(
              professionalsService
                .approve,
            ).toHaveBeenCalledWith(
              'professional-1',
            );

            expect(
              result,
            ).toEqual(
              approved,
            );
          },
        );
      },
    );

    describe(
      'reject',
      () => {
        it(
          'should reject professional by id',
          async () => {
            const rejected = {
              id:
                'professional-1',

              verificationStatus:
                'REJECTED',
            };

            professionalsService
              .reject
              .mockResolvedValue(
                rejected,
              );

            const result =
              await controller
                .reject(
                  'professional-1',
                );

            expect(
              professionalsService
                .reject,
            ).toHaveBeenCalledWith(
              'professional-1',
            );

            expect(
              result,
            ).toEqual(
              rejected,
            );
          },
        );
      },
    );

    describe(
      'create',
      () => {
        it(
          'should forward create dto to service',
          async () => {
            const dto =
              new CreateProfessionalDto();

            const created = {
              id:
                'professional-1',
            };

            professionalsService
              .create
              .mockResolvedValue(
                created,
              );

            const result =
              await controller
                .create(
                  dto,
                );

            expect(
              professionalsService
                .create,
            ).toHaveBeenCalledWith(
              dto,
            );

            expect(
              result,
            ).toEqual(
              created,
            );
          },
        );
      },
    );

    describe(
      'findPublicOne',
      () => {
        it(
          'should return public professional by id',
          async () => {
            const professional = {
              id:
                'professional-1',
            };

            professionalsService
              .findPublicOne
              .mockResolvedValue(
                professional,
              );

            const result =
              await controller
                .findPublicOne(
                  'professional-1',
                );

            expect(
              professionalsService
                .findPublicOne,
            ).toHaveBeenCalledWith(
              'professional-1',
            );

            expect(
              result,
            ).toEqual(
              professional,
            );
          },
        );
      },
    );

    describe(
      'apply',
      () => {
        it(
          'should forward authenticated user id and application dto',
          async () => {
            const dto =
              new CreateProfessionalApplicationDto();

            const response = {
              message:
                'Professional application submitted successfully',

              professionalProfile: {
                id:
                  'professional-1',
              },
            };

            professionalsService
              .apply
              .mockResolvedValue(
                response,
              );

            const result =
              await controller.apply(
                buyerRequest as never,
                dto,
              );

            expect(
              professionalsService
                .apply,
            ).toHaveBeenCalledWith(
              'buyer-1',
              dto,
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
  },
);