import {
  MortgageBank,
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  BankAffordabilityService,
} from './bank-affordability.service';

import {
  CalculateBankAffordabilityDto,
} from './dto/calculate-bank-affordability.dto';

describe(
  'BankAffordabilityService',
  () => {
    let service:
      BankAffordabilityService;

    /*
     * ============================================================
     * Helpers
     * ============================================================
     */

    const createDto = (
      overrides:
        Partial<CalculateBankAffordabilityDto> = {},
    ): CalculateBankAffordabilityDto => {
      return {
        bank:
          MortgageBank.SANTANDER,

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

        ...overrides,
      };
    };

    /*
     * Collect every numeric value returned by the service.
     *
     * This lets us verify that the financial engine never returns
     * NaN / Infinity without depending on presentation-specific
     * property names.
     */
    const collectNumericValues = (
      value: unknown,
    ): number[] => {
      if (
        typeof value === 'number'
      ) {
        return [
          value,
        ];
      }

      if (
        Array.isArray(
          value,
        )
      ) {
        return value.flatMap(
          collectNumericValues,
        );
      }

      if (
        value !== null &&
        typeof value ===
          'object'
      ) {
        return Object.values(
          value,
        ).flatMap(
          collectNumericValues,
        );
      }

      return [];
    };

    beforeEach(() => {
      service =
        new BankAffordabilityService();
    });

    /*
     * ============================================================
     * SERVICE INITIALIZATION
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

        it(
          'should expose the calculate method',
          () => {
            expect(
              typeof service.calculate,
            ).toBe(
              'function',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * SANTANDER
     * ============================================================
     */

    describe(
      'Santander affordability calculation',
      () => {
        it(
          'should calculate a Santander affordability scenario',
          () => {
            const dto =
              createDto({
                bank:
                  MortgageBank.SANTANDER,

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
              });

            const result =
              service.calculate(
                dto,
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();

            expect(
              typeof result,
            ).toBe(
              'object',
            );
          },
        );

        it(
          'should return financial numeric values for Santander',
          () => {
            const result =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.SANTANDER,
                }),
              );

            const numbers =
              collectNumericValues(
                result,
              );

            expect(
              numbers.length,
            ).toBeGreaterThan(
              0,
            );

            for (
              const value
              of numbers
            ) {
              expect(
                Number.isFinite(
                  value,
                ),
              ).toBe(
                true,
              );
            }
          },
        );
      },
    );

    /*
     * ============================================================
     * CGD
     * ============================================================
     */

    describe(
      'CGD affordability calculation',
      () => {
        it(
          'should calculate a CGD affordability scenario',
          () => {
            const dto =
              createDto({
                bank:
                  MortgageBank.CGD,

                monthlyNetIncome:
                  4500,

                existingMonthlyDebts:
                  250,

                availableDownPayment:
                  70000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            const result =
              service.calculate(
                dto,
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();

            expect(
              typeof result,
            ).toBe(
              'object',
            );
          },
        );

        it(
          'should return finite financial values for CGD',
          () => {
            const result =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.CGD,

                  monthlyNetIncome:
                    5000,

                  existingMonthlyDebts:
                    200,

                  availableDownPayment:
                    90000,
                }),
              );

            const numbers =
              collectNumericValues(
                result,
              );

            expect(
              numbers.length,
            ).toBeGreaterThan(
              0,
            );

            numbers.forEach(
              (
                value,
              ) => {
                expect(
                  Number.isFinite(
                    value,
                  ),
                ).toBe(
                  true,
                );
              },
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * MONTHLY NET INCOME
     * ============================================================
     */

    describe(
      'monthly net income',
      () => {
        it(
          'should calculate a scenario for a moderate monthly income',
          () => {
            const result =
              service.calculate(
                createDto({
                  monthlyNetIncome:
                    3500,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate a scenario for a high monthly income',
          () => {
            const result =
              service.calculate(
                createDto({
                  monthlyNetIncome:
                    10000,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should produce deterministic results for identical income inputs',
          () => {
            const dto =
              createDto({
                monthlyNetIncome:
                  6000,

                existingMonthlyDebts:
                  300,

                availableDownPayment:
                  100000,
              });

            const first =
              service.calculate(
                dto,
              );

            const second =
              service.calculate(
                dto,
              );

            expect(
              second,
            ).toEqual(
              first,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * EXISTING MONTHLY DEBTS
     * ============================================================
     */

    describe(
      'existing monthly debts',
      () => {
        it(
          'should support a buyer with no existing monthly debts',
          () => {
            const result =
              service.calculate(
                createDto({
                  existingMonthlyDebts:
                    0,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should support a buyer with existing monthly debts',
          () => {
            const result =
              service.calculate(
                createDto({
                  existingMonthlyDebts:
                    1000,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate different scenarios when debt level changes',
          () => {
            const withoutDebt =
              service.calculate(
                createDto({
                  existingMonthlyDebts:
                    0,
                }),
              );

            const withDebt =
              service.calculate(
                createDto({
                  existingMonthlyDebts:
                    1200,
                }),
              );

            expect(
              withoutDebt,
            ).toBeDefined();

            expect(
              withDebt,
            ).toBeDefined();

            /*
             * Existing debt is a financial input used by the
             * affordability engine. Different debt situations
             * should therefore not produce an identical result.
             */
            expect(
              withDebt,
            ).not.toEqual(
              withoutDebt,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * AVAILABLE DOWN PAYMENT
     * ============================================================
     */

    describe(
      'available down payment',
      () => {
        it(
          'should calculate with zero available down payment',
          () => {
            const result =
              service.calculate(
                createDto({
                  availableDownPayment:
                    0,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate with a substantial available down payment',
          () => {
            const result =
              service.calculate(
                createDto({
                  availableDownPayment:
                    150000,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should react to different available down payment amounts',
          () => {
            const lowDownPayment =
              service.calculate(
                createDto({
                  availableDownPayment:
                    20000,
                }),
              );

            const highDownPayment =
              service.calculate(
                createDto({
                  availableDownPayment:
                    150000,
                }),
              );

            expect(
              lowDownPayment,
            ).toBeDefined();

            expect(
              highDownPayment,
            ).toBeDefined();

            expect(
              highDownPayment,
            ).not.toEqual(
              lowDownPayment,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * LOAN TERM
     * ============================================================
     */

    describe(
      'loan term',
      () => {
        it(
          'should calculate using the minimum DTO loan term',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanTermYears:
                    5,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate a standard 30 year loan term',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanTermYears:
                    30,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate using the maximum DTO loan term',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanTermYears:
                    40,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should react to different loan terms',
          () => {
            const shortTerm =
              service.calculate(
                createDto({
                  loanTermYears:
                    10,
                }),
              );

            const longTerm =
              service.calculate(
                createDto({
                  loanTermYears:
                    40,
                }),
              );

            expect(
              shortTerm,
            ).toBeDefined();

            expect(
              longTerm,
            ).toBeDefined();

            expect(
              longTerm,
            ).not.toEqual(
              shortTerm,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PROPERTY PURPOSE
     * ============================================================
     */

    describe(
      'property purpose',
      () => {
        it(
          'should calculate a primary residence scenario',
          () => {
            const result =
              service.calculate(
                createDto({
                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should calculate an investment scenario',
          () => {
            const result =
              service.calculate(
                createDto({
                  purpose:
                    PropertyPurpose.INVESTMENT,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result,
            ).not.toBeNull();
          },
        );

        it(
          'should react to different property purposes',
          () => {
            const primary =
              service.calculate(
                createDto({
                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            const investment =
              service.calculate(
                createDto({
                  purpose:
                    PropertyPurpose.INVESTMENT,
                }),
              );

            expect(
              primary,
            ).toBeDefined();

            expect(
              investment,
            ).toBeDefined();

            /*
             * Purpose can affect the financing constraints/rules.
             */
            expect(
              investment,
            ).not.toEqual(
              primary,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * FINANCIAL OUTPUT SAFETY
     * ============================================================
     */

    describe(
      'financial output safety',
      () => {
        it(
          'should never return NaN numeric values',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const numbers =
              collectNumericValues(
                result,
              );

            expect(
              numbers.length,
            ).toBeGreaterThan(
              0,
            );

            numbers.forEach(
              (
                value,
              ) => {
                expect(
                  Number.isNaN(
                    value,
                  ),
                ).toBe(
                  false,
                );
              },
            );
          },
        );

        it(
          'should never return Infinity numeric values',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const numbers =
              collectNumericValues(
                result,
              );

            numbers.forEach(
              (
                value,
              ) => {
                expect(
                  Number.isFinite(
                    value,
                  ),
                ).toBe(
                  true,
                );
              },
            );
          },
        );

        it(
          'should return a serializable result',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(() =>
              JSON.stringify(
                result,
              ),
            ).not.toThrow();
          },
        );
      },
    );

    /*
     * ============================================================
     * BANK COMPARISON
     * ============================================================
     */

    describe(
      'bank comparison',
      () => {
        it(
          'should calculate the same buyer profile for Santander and CGD',
          () => {
            const santander =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.SANTANDER,

                  monthlyNetIncome:
                    5500,

                  existingMonthlyDebts:
                    250,

                  availableDownPayment:
                    100000,

                  loanTermYears:
                    30,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            const cgd =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.CGD,

                  monthlyNetIncome:
                    5500,

                  existingMonthlyDebts:
                    250,

                  availableDownPayment:
                    100000,

                  loanTermYears:
                    30,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            expect(
              santander,
            ).toBeDefined();

            expect(
              cgd,
            ).toBeDefined();

            expect(
              santander,
            ).not.toBeNull();

            expect(
              cgd,
            ).not.toBeNull();
          },
        );
      },
    );
  },
);