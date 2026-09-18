import {
  MortgageBank,
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  BankMortgageService,
} from './bank-mortgage.service';

describe(
  'BankMortgageService',
  () => {
    let service:
      BankMortgageService;

    beforeEach(() => {
      service =
        new BankMortgageService();
    });

    describe(
      'Santander mortgage calculation',
      () => {
        it(
          'should calculate a valid Santander primary residence scenario',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  500000,

                appraisalValue:
                  490000,

                downPayment:
                  100000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.bank,
            ).toBe(
              MortgageBank.SANTANDER,
            );

            expect(
              result.bankName,
            ).toContain(
              'Santander',
            );

            expect(
              result.loanAmount,
            ).toBe(
              400000,
            );

            expect(
              result.referencePropertyValue,
            ).toBe(
              490000,
            );

            expect(
              result.ltv,
            ).toBeCloseTo(
              81.63,
              1,
            );

            expect(
              result.maxLtv,
            ).toBe(
              90,
            );

            expect(
              result.ltvEligible,
            ).toBe(
              true,
            );

            expect(
              result.initialTan,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.initialMonthlyPayment,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.estimatedVariablePayment,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.balanceAfterFixedPeriod,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.estimatedInterest,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.estimatedTotalPayments,
            ).toBeGreaterThan(
              result.loanAmount,
            );
          },
        );
      },
    );

    describe(
      'CGD mortgage calculation',
      () => {
        it(
          'should calculate a valid CGD scenario',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.CGD,

                propertyPrice:
                  500000,

                appraisalValue:
                  490000,

                downPayment:
                  100000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.bank,
            ).toBe(
              MortgageBank.CGD,
            );

            expect(
              result.bankName,
            ).toContain(
              'Caixa',
            );

            expect(
              result.loanAmount,
            ).toBe(
              400000,
            );

            expect(
              result.ltvEligible,
            ).toBe(
              true,
            );

            expect(
              result.initialMonthlyPayment,
            ).toBeGreaterThan(
              0,
            );
          },
        );
      },
    );

    describe(
      'LTV rules',
      () => {
        it(
          'should reject LTV above primary residence reference limit',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  500000,

                appraisalValue:
                  500000,

                downPayment:
                  25000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.loanAmount,
            ).toBe(
              475000,
            );

            expect(
              result.ltv,
            ).toBe(
              95,
            );

            expect(
              result.maxLtv,
            ).toBe(
              90,
            );

            expect(
              result.ltvEligible,
            ).toBe(
              false,
            );

            expect(
              result.additionalDownPaymentNeeded,
            ).toBeGreaterThan(
              0,
            );
          },
        );

        it(
          'should use 80 percent max LTV for investment property',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.CGD,

                propertyPrice:
                  400000,

                appraisalValue:
                  400000,

                downPayment:
                  80000,

                loanTermYears:
                  25,

                purpose:
                  PropertyPurpose.INVESTMENT,
              });

            expect(
              result.maxLtv,
            ).toBe(
              80,
            );

            expect(
              result.ltv,
            ).toBe(
              80,
            );

            expect(
              result.ltvEligible,
            ).toBe(
              true,
            );
          },
        );
      },
    );

    describe(
      'reference property value',
      () => {
        it(
          'should use appraisal value when it is lower than property price',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  500000,

                appraisalValue:
                  450000,

                downPayment:
                  100000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.referencePropertyValue,
            ).toBe(
              450000,
            );
          },
        );

        it(
          'should use property price when it is lower than appraisal',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  450000,

                appraisalValue:
                  500000,

                downPayment:
                  90000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.referencePropertyValue,
            ).toBe(
              450000,
            );
          },
        );
      },
    );

    describe(
      'validation',
      () => {
        it(
          'should throw when down payment is equal to property price',
          () => {
            expect(() =>
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  300000,

                appraisalValue:
                  300000,

                downPayment:
                  300000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              }),
            ).toThrow();
          },
        );

        it(
          'should throw when appraisal value is zero',
          () => {
            expect(() =>
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  300000,

                appraisalValue:
                  0,

                downPayment:
                  60000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              }),
            ).toThrow();
          },
        );
      },
    );

    describe(
      'mixed rate behavior',
      () => {
        it(
          'should calculate remaining balance after fixed period',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  500000,

                appraisalValue:
                  500000,

                downPayment:
                  100000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.fixedPeriodMonths,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.balanceAfterFixedPeriod,
            ).toBeLessThan(
              result.loanAmount,
            );

            expect(
              result.balanceAfterFixedPeriod,
            ).toBeGreaterThan(
              0,
            );
          },
        );

        it(
          'should expose the variable reference rate',
          () => {
            const result =
              service.calculate({
                bank:
                  MortgageBank.SANTANDER,

                propertyPrice:
                  500000,

                appraisalValue:
                  500000,

                downPayment:
                  100000,

                loanTermYears:
                  30,

                purpose:
                  PropertyPurpose.PRIMARY_RESIDENCE,
              });

            expect(
              result.variableTan,
            ).toBeGreaterThan(
              0,
            );

            expect(
              result.euriborRate,
            ).toBeDefined();

            expect(
              result.spread,
            ).toBeDefined();
          },
        );
      },
    );
  },
);