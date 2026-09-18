import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  Role,
} from '@prisma/client';

import {
  LeadsController,
} from './leads.controller';

import {
  LeadsService,
} from './leads.service';

import {
  CreateAffordabilityLeadDto,
} from './dto/create-affordability-lead.dto';

import {
  CreateCalculatorLeadDto,
} from './dto/create-calculator-lead.dto';

import {
  CreateNeighborhoodLeadDto,
} from './dto/create-neighborhood-lead.dto';

import {
  CreatePriceCheckerDto,
} from './dto/create-price-checker.dto';

import {
  CreatePropertySearchLeadDto,
} from './dto/create-property-search-lead.dto';

import {
  CreateTrueCostLeadDto,
} from './dto/create-true-cost-lead.dto';

import {
  CreateValuationLeadDto,
} from './dto/create-valuation-lead.dto';

import {
  UpdateLeadDto,
} from './dto/update-lead.dto';

import {
  UpdatePropertyAlertsDto,
} from './dto/update-property-alerts.dto';

describe(
  'LeadsController',
  () => {
    let controller:
      LeadsController;

    let leadsService: {
      findMine:
        jest.Mock;

      createFromCalculator:
        jest.Mock;

      createFromNeighborhoodFinder:
        jest.Mock;

      createFromPropertyValuation:
        jest.Mock;

      createFromPropertySearch:
        jest.Mock;

      createFromPriceChecker:
        jest.Mock;

      createFromAffordabilityCalculator:
        jest.Mock;

      createFromTrueCostCalculator:
        jest.Mock;

      updatePropertyAlerts:
        jest.Mock;

      findAll:
        jest.Mock;

      findOne:
        jest.Mock;

      update:
        jest.Mock;

      remove:
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

    const adminRequest = {
      user: {
        id:
          'admin-1',

        role:
          Role.ADMIN,
      },
    };

    beforeEach(
      async () => {
        leadsService = {
          findMine:
            jest.fn(),

          createFromCalculator:
            jest.fn(),

          createFromNeighborhoodFinder:
            jest.fn(),

          createFromPropertyValuation:
            jest.fn(),

          createFromPropertySearch:
            jest.fn(),

          createFromPriceChecker:
            jest.fn(),

          createFromAffordabilityCalculator:
            jest.fn(),

          createFromTrueCostCalculator:
            jest.fn(),

          updatePropertyAlerts:
            jest.fn(),

          findAll:
            jest.fn(),

          findOne:
            jest.fn(),

          update:
            jest.fn(),

          remove:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              LeadsController,
            ],

            providers: [
              {
                provide:
                  LeadsService,

                useValue:
                  leadsService,
              },
            ],
          }).compile();

        controller =
          module.get<LeadsController>(
            LeadsController,
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
      'findMine',
      () => {
        it(
          'should return authenticated buyer requests',
          async () => {
            const leads = [
              {
                id:
                  'lead-1',
              },
            ];

            leadsService
              .findMine
              .mockResolvedValue(
                leads,
              );

            const result =
              await controller.findMine(
                buyerRequest as never,
              );

            expect(
              leadsService
                .findMine,
            ).toHaveBeenCalledWith(
              'buyer-1',
            );

            expect(
              result,
            ).toEqual(
              leads,
            );
          },
        );
      },
    );

    describe(
      'createFromCalculator',
      () => {
        it(
          'should forward calculator dto and authenticated buyer',
          async () => {
            const dto =
              new CreateCalculatorLeadDto();

            const response = {
              id:
                'lead-1',

              alreadyExists:
                false,
            };

            leadsService
              .createFromCalculator
              .mockResolvedValue(
                response,
              );

            const result =
              await controller
                .createFromCalculator(
                  dto,
                  buyerRequest as never,
                );

            expect(
              leadsService
                .createFromCalculator,
            ).toHaveBeenCalledWith(
              dto,
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

    describe(
      'createFromNeighborhoodFinder',
      () => {
        it(
          'should forward neighborhood dto and authenticated buyer',
          async () => {
            const dto =
              new CreateNeighborhoodLeadDto();

            leadsService
              .createFromNeighborhoodFinder
              .mockResolvedValue({
                id:
                  'lead-1',
              });

            await controller
              .createFromNeighborhoodFinder(
                dto,
                buyerRequest as never,
              );

            expect(
              leadsService
                .createFromNeighborhoodFinder,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );
          },
        );
      },
    );

    describe(
      'createFromPropertyValuation',
      () => {
        it(
          'should forward valuation dto and authenticated buyer',
          async () => {
            const dto =
              new CreateValuationLeadDto();

            leadsService
              .createFromPropertyValuation
              .mockResolvedValue({
                id:
                  'lead-1',
              });

            await controller
              .createFromPropertyValuation(
                dto,
                buyerRequest as never,
              );

            expect(
              leadsService
                .createFromPropertyValuation,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );
          },
        );
      },
    );

    describe(
      'createFromPropertySearch',
      () => {
        it(
          'should forward property search dto and authenticated buyer',
          async () => {
            const dto =
              new CreatePropertySearchLeadDto();

            leadsService
              .createFromPropertySearch
              .mockResolvedValue({
                found:
                  false,

                lead: {
                  id:
                    'lead-1',
                },
              });

            const result =
              await controller
                .createFromPropertySearch(
                  dto,
                  buyerRequest as never,
                );

            expect(
              leadsService
                .createFromPropertySearch,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );

            expect(
              result,
            ).toEqual({
              found:
                false,

              lead: {
                id:
                  'lead-1',
              },
            });
          },
        );
      },
    );

    describe(
      'createFromPriceChecker',
      () => {
        it(
          'should forward price checker dto and authenticated buyer',
          async () => {
            const dto =
              new CreatePriceCheckerDto();

            leadsService
              .createFromPriceChecker
              .mockResolvedValue({
                id:
                  'lead-1',
              });

            await controller
              .createFromPriceChecker(
                dto,
                buyerRequest as never,
              );

            expect(
              leadsService
                .createFromPriceChecker,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );
          },
        );
      },
    );

    describe(
      'createFromAffordabilityCalculator',
      () => {
        it(
          'should forward affordability dto and authenticated buyer',
          async () => {
            const dto =
              new CreateAffordabilityLeadDto();

            leadsService
              .createFromAffordabilityCalculator
              .mockResolvedValue({
                id:
                  'lead-1',
              });

            await controller
              .createFromAffordabilityCalculator(
                dto,
                buyerRequest as never,
              );

            expect(
              leadsService
                .createFromAffordabilityCalculator,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );
          },
        );
      },
    );

    describe(
      'createFromTrueCostCalculator',
      () => {
        it(
          'should forward true cost dto and authenticated buyer',
          async () => {
            const dto =
              new CreateTrueCostLeadDto();

            leadsService
              .createFromTrueCostCalculator
              .mockResolvedValue({
                id:
                  'lead-1',
              });

            await controller
              .createFromTrueCostCalculator(
                dto,
                buyerRequest as never,
              );

            expect(
              leadsService
                .createFromTrueCostCalculator,
            ).toHaveBeenCalledWith(
              dto,
              buyerRequest.user,
            );
          },
        );
      },
    );

    describe(
      'updatePropertyAlerts',
      () => {
        it(
          'should forward id, enabled flag and authenticated buyer',
          async () => {
            const dto =
              new UpdatePropertyAlertsDto();

            dto.enabled =
              true;

            const response = {
              id:
                'lead-1',

              isActive:
                true,

              notificationsEnabled:
                true,
            };

            leadsService
              .updatePropertyAlerts
              .mockResolvedValue(
                response,
              );

            const result =
              await controller
                .updatePropertyAlerts(
                  'lead-1',
                  dto,
                  buyerRequest as never,
                );

            expect(
              leadsService
                .updatePropertyAlerts,
            ).toHaveBeenCalledWith(
              'lead-1',
              true,
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

    describe(
      'findAll',
      () => {
        it(
          'should forward authenticated admin to service',
          async () => {
            const leads = [
              {
                id:
                  'lead-1',
              },
            ];

            leadsService
              .findAll
              .mockResolvedValue(
                leads,
              );

            const result =
              await controller
                .findAll(
                  adminRequest as never,
                );

            expect(
              leadsService
                .findAll,
            ).toHaveBeenCalledWith(
              adminRequest.user,
            );

            expect(
              result,
            ).toEqual(
              leads,
            );
          },
        );
      },
    );

    describe(
      'findOne',
      () => {
        it(
          'should forward lead id and authenticated admin',
          async () => {
            const lead = {
              id:
                'lead-1',
            };

            leadsService
              .findOne
              .mockResolvedValue(
                lead,
              );

            const result =
              await controller
                .findOne(
                  'lead-1',
                  adminRequest as never,
                );

            expect(
              leadsService
                .findOne,
            ).toHaveBeenCalledWith(
              'lead-1',
              adminRequest.user,
            );

            expect(
              result,
            ).toEqual(
              lead,
            );
          },
        );
      },
    );

    describe(
      'update',
      () => {
        it(
          'should forward id, dto and authenticated user',
          async () => {
            const dto =
              new UpdateLeadDto();

            const updated = {
              id:
                'lead-1',
            };

            leadsService
              .update
              .mockResolvedValue(
                updated,
              );

            const result =
              await controller.update(
                'lead-1',
                dto,
                adminRequest as never,
              );

            expect(
              leadsService
                .update,
            ).toHaveBeenCalledWith(
              'lead-1',
              dto,
              adminRequest.user,
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
      'remove',
      () => {
        it(
          'should forward lead id and authenticated user',
          async () => {
            leadsService
              .remove
              .mockResolvedValue({
                message:
                  'Lead deleted successfully',
              });

            const result =
              await controller.remove(
                'lead-1',
                adminRequest as never,
              );

            expect(
              leadsService
                .remove,
            ).toHaveBeenCalledWith(
              'lead-1',
              adminRequest.user,
            );

            expect(
              result,
            ).toEqual({
              message:
                'Lead deleted successfully',
            });
          },
        );
      },
    );
  },
);