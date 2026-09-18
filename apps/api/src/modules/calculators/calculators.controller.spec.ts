import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  CalculatorsController,
} from './calculators.controller';

import {
  CalculatorsService,
} from './calculators.service';

import {
  BankMortgageService,
} from './bank-mortgage.service';

import {
  BankAffordabilityService,
} from './bank-affordability.service';

import {
  BankTrueCostService,
} from './bank-true-cost.service';

import {
  MortgageCalculatorDto,
} from './dto/mortgage-calculator.dto';

import {
  AffordabilityCalculatorDto,
} from './dto/affordability-calculator.dto';

import {
  TrueCostCalculatorDto,
} from './dto/true-cost-calculator.dto';

import {
  CalculateBankMortgageDto,
} from './dto/calculate-bank-mortgage.dto';

import {
  CalculateBankAffordabilityDto,
} from './dto/calculate-bank-affordability.dto';

import {
  CalculateBankTrueCostDto,
} from './dto/calculate-bank-true-cost.dto';

import {
  MortgageBank,
  PropertyPurpose,
} from './bank-mortgage.types';

describe(
  'CalculatorsController',
  () => {
    let controller:
      CalculatorsController;

    let calculatorsService: {
      calculateMortgage:
        jest.Mock;

      calculateAffordability:
        jest.Mock;

      calculateTrueCost:
        jest.Mock;
    };

    let bankMortgageService: {
      calculate:
        jest.Mock;
    };

    let bankAffordabilityService: {
      calculate:
        jest.Mock;
    };

    let bankTrueCostService: {
      calculate:
        jest.Mock;
    };

    beforeEach(
      async () => {
        calculatorsService = {
          calculateMortgage:
            jest.fn(),

          calculateAffordability:
            jest.fn(),

          calculateTrueCost:
            jest.fn(),
        };

        bankMortgageService = {
          calculate:
            jest.fn(),
        };

        bankAffordabilityService = {
          calculate:
            jest.fn(),
        };

        bankTrueCostService = {
          calculate:
            jest.fn(),
        };

        const module:
          TestingModule =
          await Test.createTestingModule({
            controllers: [
              CalculatorsController,
            ],

            providers: [
              {
                provide:
                  CalculatorsService,

                useValue:
                  calculatorsService,
              },

              {
                provide:
                  BankMortgageService,

                useValue:
                  bankMortgageService,
              },

              {
                provide:
                  BankAffordabilityService,

                useValue:
                  bankAffordabilityService,
              },

              {
                provide:
                  BankTrueCostService,

                useValue:
                  bankTrueCostService,
              },
            ],
          }).compile();

        controller =
          module.get<CalculatorsController>(
            CalculatorsController,
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

    /*
     * ============================================================
     * CLASSIC MORTGAGE
     * ============================================================
     */

    describe(
      'calculateMortgage',
      () => {
        it(
          'should forward dto to CalculatorsService',
          () => {
            const dto = {
              propertyPrice:
                350000,

              downPayment:
                70000,

              interestRate:
                3.5,

              loanTermYears:
                30,
            } as MortgageCalculatorDto;

            const response = {
              monthlyPayment:
                1250,

              loanAmount:
                280000,
            };

            calculatorsService
              .calculateMortgage
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateMortgage(
                  dto,
                );

            expect(
              calculatorsService
                .calculateMortgage,
            ).toHaveBeenCalledWith(
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

    /*
     * ============================================================
     * CLASSIC AFFORDABILITY
     * ============================================================
     */

    describe(
      'calculateAffordability',
      () => {
        it(
          'should forward dto to CalculatorsService',
          () => {
            const dto =
  new AffordabilityCalculatorDto();

            const response = {
              maximumLoan:
                300000,

              maximumPropertyPrice:
                350000,
            };

            calculatorsService
              .calculateAffordability
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateAffordability(
                  dto,
                );

            expect(
              calculatorsService
                .calculateAffordability,
            ).toHaveBeenCalledWith(
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

    /*
     * ============================================================
     * CLASSIC TRUE COST
     * ============================================================
     */

    describe(
      'calculateTrueCost',
      () => {
        it(
          'should forward dto to CalculatorsService',
          () => {
            const dto = {
              propertyPrice:
                350000,
            } as TrueCostCalculatorDto;

            const response = {
              totalCost:
                380000,
            };

            calculatorsService
              .calculateTrueCost
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateTrueCost(
                  dto,
                );

            expect(
              calculatorsService
                .calculateTrueCost,
            ).toHaveBeenCalledWith(
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

    /*
     * ============================================================
     * BANK MORTGAGE
     * ============================================================
     */

    describe(
      'calculateBankMortgage',
      () => {
        it(
          'should forward dto to BankMortgageService',
          () => {
            const dto = {
              bank:
                MortgageBank.SANTANDER,

              propertyPrice:
                350000,

              appraisalValue:
                350000,

              downPayment:
                70000,

              loanTermYears:
                30,

              purpose:
                PropertyPurpose.PRIMARY_RESIDENCE,
            } as CalculateBankMortgageDto;

            const response = {
              bank:
                MortgageBank.SANTANDER,

              loanAmount:
                280000,

              initialMonthlyPayment:
                1200,
            };

            bankMortgageService
              .calculate
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateBankMortgage(
                  dto,
                );

            expect(
              bankMortgageService
                .calculate,
            ).toHaveBeenCalledWith(
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

    /*
     * ============================================================
     * BANK AFFORDABILITY
     * ============================================================
     */

    describe(
      'calculateBankAffordability',
      () => {
        it(
          'should forward dto to BankAffordabilityService',
          () => {
            const dto = {
              bank:
                MortgageBank.CGD,

              monthlyNetIncome:
                5000,

              existingMonthlyDebts:
                300,

              availableDownPayment:
                80000,

              loanTermYears:
                30,

              purpose:
                PropertyPurpose.PRIMARY_RESIDENCE,
            } as CalculateBankAffordabilityDto;

            const response = {
              bank:
                MortgageBank.CGD,

              estimatedMaximumPropertyPrice:
                420000,
            };

            bankAffordabilityService
              .calculate
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateBankAffordability(
                  dto,
                );

            expect(
              bankAffordabilityService
                .calculate,
            ).toHaveBeenCalledWith(
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

    /*
     * ============================================================
     * BANK TRUE COST
     * ============================================================
     */

    describe(
      'calculateBankTrueCost',
      () => {
        it(
          'should forward dto to BankTrueCostService',
          () => {
            const dto = {
              propertyPrice:
                350000,

              vptValue:
                300000,

              purpose:
                PropertyPurpose.PRIMARY_RESIDENCE,

              bank:
                MortgageBank.SANTANDER,

              loanAmount:
                280000,

              loanTermYears:
                30,
            } as CalculateBankTrueCostDto;

            const response = {
              propertyPrice:
                350000,

              totalExtraCosts:
                25000,

              estimatedTotalAcquisitionCost:
                375000,
            };

            bankTrueCostService
              .calculate
              .mockReturnValue(
                response,
              );

            const result =
              controller
                .calculateBankTrueCost(
                  dto,
                );

            expect(
              bankTrueCostService
                .calculate,
            ).toHaveBeenCalledWith(
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