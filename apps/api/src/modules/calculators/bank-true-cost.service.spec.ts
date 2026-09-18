import {
  BadRequestException,
} from '@nestjs/common';

import {
  MortgageBank,
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  PurchaseRegion,
} from './bank-true-cost.types';

import {
  BankTrueCostService,
} from './bank-true-cost.service';

import {
  CalculateBankTrueCostDto,
} from './dto/calculate-bank-true-cost.dto';

describe(
  'BankTrueCostService',
  () => {
    let service:
      BankTrueCostService;

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    const createDto = (
      overrides:
        Partial<CalculateBankTrueCostDto> = {},
    ): CalculateBankTrueCostDto => {
      return {
        propertyPrice:
          400000,

        vptValue:
          350000,

        purpose:
          PropertyPurpose.PRIMARY_RESIDENCE,

        region:
          PurchaseRegion.MAINLAND,

        bank:
          MortgageBank.SANTANDER,

        loanAmount:
          300000,

        loanTermYears:
          30,

        legalFees:
          0,

        registrationNotaryFees:
          0,

        ...overrides,
      };
    };

    beforeEach(() => {
      service =
        new BankTrueCostService();
    });

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
              service,
            ).toBeDefined();
          },
        );

        it(
          'should expose calculate method',
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
     * BASIC CALCULATION
     * ============================================================
     */

    describe(
      'basic calculation',
      () => {
        it(
          'should calculate a complete Santander scenario',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result.propertyPrice,
            ).toBe(
              400000,
            );

            expect(
              result.vptValue,
            ).toBe(
              350000,
            );

            expect(
              result.bank,
            ).toBe(
              MortgageBank.SANTANDER,
            );

            expect(
              result.bankName,
            ).toBeDefined();

            expect(
              result.loanAmount,
            ).toBe(
              300000,
            );

            expect(
              result.loanTermYears,
            ).toBe(
              30,
            );
          },
        );

        it(
          'should calculate a complete CGD scenario',
          () => {
            const result =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.CGD,
                }),
              );

            expect(
              result,
            ).toBeDefined();

            expect(
              result.bank,
            ).toBe(
              MortgageBank.CGD,
            );

            expect(
              result.bankName,
            ).toBeDefined();

            expect(
              result.bankFees.total,
            ).toBeGreaterThan(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * TAXABLE PROPERTY VALUE
     * ============================================================
     */

    describe(
      'taxable property value',
      () => {
        it(
          'should use property price when it is higher than VPT',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  vptValue:
                    300000,
                }),
              );

            expect(
              result.taxablePropertyValue,
            ).toBe(
              400000,
            );
          },
        );

        it(
          'should use VPT when VPT is higher than property price',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  vptValue:
                    450000,
                }),
              );

            expect(
              result.taxablePropertyValue,
            ).toBe(
              450000,
            );
          },
        );

        it(
          'should use the same value when price and VPT are equal',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  vptValue:
                    400000,
                }),
              );

            expect(
              result.taxablePropertyValue,
            ).toBe(
              400000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * ACQUISITION STAMP DUTY
     * ============================================================
     */

    describe(
      'acquisition stamp duty',
      () => {
        it(
          'should apply 0.8 percent acquisition stamp duty',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  vptValue:
                    350000,
                }),
              );

            expect(
              result.acquisitionStampDutyRate,
            ).toBe(
              0.8,
            );

            expect(
              result.acquisitionStampDuty,
            ).toBe(
              3200,
            );
          },
        );

        it(
          'should calculate acquisition stamp duty using higher VPT',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  vptValue:
                    500000,
                }),
              );

            expect(
              result.taxablePropertyValue,
            ).toBe(
              500000,
            );

            expect(
              result.acquisitionStampDuty,
            ).toBe(
              4000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * MORTGAGE STAMP DUTY
     * ============================================================
     */

    describe(
      'mortgage stamp duty',
      () => {
        it(
          'should apply 0.6 percent for loan terms above 5 years',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanAmount:
                    300000,

                  loanTermYears:
                    30,
                }),
              );

            expect(
              result.mortgageStampDutyRate,
            ).toBe(
              0.6,
            );

            expect(
              result.mortgageStampDuty,
            ).toBe(
              1800,
            );
          },
        );

        it(
          'should apply 0.5 percent for a 5 year loan',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanAmount:
                    200000,

                  loanTermYears:
                    5,
                }),
              );

            expect(
              result.mortgageStampDutyRate,
            ).toBe(
              0.5,
            );

            expect(
              result.mortgageStampDuty,
            ).toBe(
              1000,
            );
          },
        );

        it(
          'should return zero mortgage stamp duty when there is no loan',
          () => {
            const result =
              service.calculate(
                createDto({
                  loanAmount:
                    0,
                }),
              );

            expect(
              result.mortgageStampDuty,
            ).toBe(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PRIMARY RESIDENCE IMT
     * ============================================================
     */

    describe(
      'primary residence IMT',
      () => {
        it(
          'should return zero IMT below first primary residence threshold',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    100000,

                  vptValue:
                    90000,

                  loanAmount:
                    70000,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            expect(
              result.imtTax,
            ).toBe(
              0,
            );
          },
        );

        it(
          'should calculate progressive IMT above first threshold',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    145470,

                  vptValue:
                    100000,

                  loanAmount:
                    100000,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            /*
             * 145470 - 106346
             * = 39124
             *
             * 39124 × 2%
             * = 782.48
             */

            expect(
              result.imtTax,
            ).toBeCloseTo(
              782.48,
              2,
            );
          },
        );

        it(
          'should apply 6 percent single rate above 660982 and up to 1150853',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    700000,

                  vptValue:
                    600000,

                  loanAmount:
                    500000,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            expect(
              result.imtTax,
            ).toBe(
              42000,
            );
          },
        );

        it(
          'should apply 7.5 percent single rate above 1150853',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    1200000,

                  vptValue:
                    1000000,

                  loanAmount:
                    800000,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            expect(
              result.imtTax,
            ).toBe(
              90000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * INVESTMENT / OTHER HOUSING IMT
     * ============================================================
     */

    describe(
      'investment property IMT',
      () => {
        it(
          'should apply 1 percent in first investment bracket',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    100000,

                  vptValue:
                    90000,

                  loanAmount:
                    70000,

                  purpose:
                    PropertyPurpose.INVESTMENT,
                }),
              );

            expect(
              result.imtTax,
            ).toBe(
              1000,
            );
          },
        );

        it(
          'should calculate more IMT for investment than primary residence at low value',
          () => {
            const primary =
              service.calculate(
                createDto({
                  propertyPrice:
                    100000,

                  vptValue:
                    90000,

                  loanAmount:
                    70000,

                  purpose:
                    PropertyPurpose.PRIMARY_RESIDENCE,
                }),
              );

            const investment =
              service.calculate(
                createDto({
                  propertyPrice:
                    100000,

                  vptValue:
                    90000,

                  loanAmount:
                    70000,

                  purpose:
                    PropertyPurpose.INVESTMENT,
                }),
              );

            expect(
              investment.imtTax,
            ).toBeGreaterThan(
              primary.imtTax,
            );
          },
        );

        it(
          'should apply 6 percent single rate above 633931',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    700000,

                  vptValue:
                    600000,

                  loanAmount:
                    500000,

                  purpose:
                    PropertyPurpose.INVESTMENT,
                }),
              );

            expect(
              result.imtTax,
            ).toBe(
              42000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * BANK FEES
     * ============================================================
     */

    describe(
      'bank fees',
      () => {
        it(
          'should calculate bank fee subtotal correctly',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expectedBeforeTax =
              result.bankFees
                .dossierOrStudyFee +
              result.bankFees
                .appraisalFee +
              result.bankFees
                .formalizationFee;

            expect(
              result.bankFees
                .feesBeforeTax,
            ).toBeCloseTo(
              expectedBeforeTax,
              2,
            );
          },
        );

        it(
          'should apply commission stamp duty to bank fees',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expectedTax =
              result.bankFees
                .feesBeforeTax *
              (
                result.bankFees
                  .commissionStampDutyRate /
                100
              );

            expect(
              result.bankFees
                .commissionStampDuty,
            ).toBeCloseTo(
              expectedTax,
              2,
            );
          },
        );

        it(
          'should calculate total bank fees correctly',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expected =
              result.bankFees
                .feesBeforeTax +
              result.bankFees
                .commissionStampDuty;

            expect(
              result.bankFees.total,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );

        it(
          'should support Santander bank fee profile',
          () => {
            const result =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.SANTANDER,
                }),
              );

            expect(
              result.bank,
            ).toBe(
              MortgageBank.SANTANDER,
            );

            expect(
              result.bankFees.total,
            ).toBeGreaterThan(
              0,
            );
          },
        );

        it(
          'should support CGD bank fee profile',
          () => {
            const result =
              service.calculate(
                createDto({
                  bank:
                    MortgageBank.CGD,
                }),
              );

            expect(
              result.bank,
            ).toBe(
              MortgageBank.CGD,
            );

            expect(
              result.bankFees.total,
            ).toBeGreaterThan(
              0,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * OPTIONAL COSTS
     * ============================================================
     */

    describe(
      'optional professional and transaction costs',
      () => {
        it(
          'should default legal fees to zero',
          () => {
            const dto =
              createDto();

            delete dto.legalFees;

            const result =
              service.calculate(
                dto,
              );

            expect(
              result.legalFees,
            ).toBe(
              0,
            );
          },
        );

        it(
          'should default registration and notary fees to zero',
          () => {
            const dto =
              createDto();

            delete dto
              .registrationNotaryFees;

            const result =
              service.calculate(
                dto,
              );

            expect(
              result
                .registrationNotaryFees,
            ).toBe(
              0,
            );
          },
        );

        it(
          'should include supplied legal fees',
          () => {
            const result =
              service.calculate(
                createDto({
                  legalFees:
                    2500,
                }),
              );

            expect(
              result.legalFees,
            ).toBe(
              2500,
            );
          },
        );

        it(
          'should include supplied registration and notary fees',
          () => {
            const result =
              service.calculate(
                createDto({
                  registrationNotaryFees:
                    1500,
                }),
              );

            expect(
              result
                .registrationNotaryFees,
            ).toBe(
              1500,
            );
          },
        );

        it(
          'should increase total extra costs when optional costs are supplied',
          () => {
            const withoutOptional =
              service.calculate(
                createDto({
                  legalFees:
                    0,

                  registrationNotaryFees:
                    0,
                }),
              );

            const withOptional =
              service.calculate(
                createDto({
                  legalFees:
                    2500,

                  registrationNotaryFees:
                    1500,
                }),
              );

            expect(
              withOptional
                .totalExtraCosts -
                withoutOptional
                  .totalExtraCosts,
            ).toBe(
              4000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * GOVERNMENT TAX TOTAL
     * ============================================================
     */

    describe(
      'government taxes',
      () => {
        it(
          'should equal IMT plus acquisition and mortgage stamp duty',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expected =
              result.imtTax +
              result
                .acquisitionStampDuty +
              result
                .mortgageStampDuty;

            expect(
              result.governmentTaxes,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * TOTAL EXTRA COSTS
     * ============================================================
     */

    describe(
      'total extra costs',
      () => {
        it(
          'should include taxes, bank fees, legal fees and registration fees',
          () => {
            const result =
              service.calculate(
                createDto({
                  legalFees:
                    2000,

                  registrationNotaryFees:
                    1200,
                }),
              );

            const expected =
              result.governmentTaxes +
              result.bankFees.total +
              result.legalFees +
              result
                .registrationNotaryFees;

            expect(
              result.totalExtraCosts,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );

        it(
          'should calculate extra cost percentage correctly',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expected =
              (
                result.totalExtraCosts /
                result.propertyPrice
              ) *
              100;

            expect(
              result.extraCostPercentage,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * TOTAL ACQUISITION COST
     * ============================================================
     */

    describe(
      'estimated total acquisition cost',
      () => {
        it(
          'should equal property price plus extra costs',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expected =
              result.propertyPrice +
              result.totalExtraCosts;

            expect(
              result
                .estimatedTotalAcquisitionCost,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * PURCHASE EQUITY
     * ============================================================
     */

    describe(
      'purchase equity',
      () => {
        it(
          'should calculate property price minus loan amount',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  loanAmount:
                    300000,
                }),
              );

            expect(
              result.purchaseEquity,
            ).toBe(
              100000,
            );
          },
        );

        it(
          'should equal full property price for a cash purchase',
          () => {
            const result =
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  loanAmount:
                    0,
                }),
              );

            expect(
              result.purchaseEquity,
            ).toBe(
              400000,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * CASH REQUIRED
     * ============================================================
     */

    describe(
      'estimated cash required',
      () => {
        it(
          'should equal purchase equity plus extra costs',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const expected =
              result.purchaseEquity +
              result.totalExtraCosts;

            expect(
              result
                .estimatedCashRequired,
            ).toBeCloseTo(
              expected,
              2,
            );
          },
        );

        it(
          'should require more cash when loan amount decreases',
          () => {
            const higherLoan =
              service.calculate(
                createDto({
                  loanAmount:
                    300000,
                }),
              );

            const lowerLoan =
              service.calculate(
                createDto({
                  loanAmount:
                    200000,
                }),
              );

            expect(
              lowerLoan
                .estimatedCashRequired,
            ).toBeGreaterThan(
              higherLoan
                .estimatedCashRequired,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * VALIDATION / BUSINESS RULES
     * ============================================================
     */

    describe(
      'business validation',
      () => {
        it(
          'should throw when loan amount exceeds property price',
          () => {
            expect(() =>
              service.calculate(
                createDto({
                  propertyPrice:
                    400000,

                  loanAmount:
                    450000,
                }),
              ),
            ).toThrow(
              BadRequestException,
            );
          },
        );

        it(
          'should throw the expected message when loan exceeds property price',
          () => {
            expect(() =>
              service.calculate(
                createDto({
                  propertyPrice:
                    300000,

                  loanAmount:
                    350000,
                }),
              ),
            ).toThrow(
              'Loan amount cannot exceed property price',
            );
          },
        );

        it(
          'should throw for unsupported mortgage bank',
          () => {
            const dto =
              createDto();

            dto.bank =
              'UNSUPPORTED_BANK' as MortgageBank;

            expect(() =>
              service.calculate(
                dto,
              ),
            ).toThrow(
              BadRequestException,
            );
          },
        );

        it(
          'should throw expected message for unsupported bank',
          () => {
            const dto =
              createDto();

            dto.bank =
              'UNSUPPORTED_BANK' as MortgageBank;

            expect(() =>
              service.calculate(
                dto,
              ),
            ).toThrow(
              'Unsupported mortgage bank',
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * METADATA
     * ============================================================
     */

    describe(
      'source metadata',
      () => {
        it(
          'should expose 2026 tax year',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(
              result.conditions
                .taxYear,
            ).toBe(
              2026,
            );
          },
        );

        it(
          'should expose Portugal Mainland jurisdiction',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(
              result.conditions
                .jurisdiction,
            ).toBe(
              'Portugal Mainland',
            );
          },
        );

        it(
          'should expose bank source metadata',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(
              result.conditions
                .bankEffectiveFrom,
            ).toBeDefined();

            expect(
              result.conditions
                .bankSourceLabel,
            ).toBeDefined();
          },
        );

        it(
          'should expose a disclaimer',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            expect(
              typeof result.disclaimer,
            ).toBe(
              'string',
            );

            expect(
              result.disclaimer.length,
            ).toBeGreaterThan(
              20,
            );
          },
        );
      },
    );

    /*
     * ============================================================
     * OUTPUT SAFETY
     * ============================================================
     */

    describe(
      'output safety',
      () => {
        it(
          'should not return NaN for main numeric values',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const values = [
              result.propertyPrice,
              result.vptValue,
              result.taxablePropertyValue,
              result.loanAmount,
              result.purchaseEquity,
              result.imtTax,
              result.acquisitionStampDuty,
              result.mortgageStampDuty,
              result.governmentTaxes,
              result.bankFees.total,
              result.totalExtraCosts,
              result.extraCostPercentage,
              result.estimatedTotalAcquisitionCost,
              result.estimatedCashRequired,
            ];

            values.forEach(
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
          'should return only finite main numeric values',
          () => {
            const result =
              service.calculate(
                createDto(),
              );

            const values = [
              result.propertyPrice,
              result.vptValue,
              result.taxablePropertyValue,
              result.loanAmount,
              result.purchaseEquity,
              result.imtTax,
              result.acquisitionStampDuty,
              result.mortgageStampDuty,
              result.governmentTaxes,
              result.bankFees.total,
              result.totalExtraCosts,
              result.extraCostPercentage,
              result.estimatedTotalAcquisitionCost,
              result.estimatedCashRequired,
            ];

            values.forEach(
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
          'should return a JSON serializable result',
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

        it(
          'should produce deterministic results',
          () => {
            const dto =
              createDto({
                propertyPrice:
                  450000,

                vptValue:
                  420000,

                loanAmount:
                  300000,

                legalFees:
                  2000,

                registrationNotaryFees:
                  1000,
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
  },
);