import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  BANK_MORTGAGE_PROFILES,
} from './bank-mortgage.config';

import {
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  CalculateBankAffordabilityDto,
} from './dto/calculate-bank-affordability.dto';

@Injectable()
export class BankAffordabilityService {
  /*
   * Banco de Portugal reference DSTI ceiling.
   *
   * This is used as an indicative reference,
   * not as a guarantee of approval.
   */
  private readonly maxDsti =
    50;

  /*
   * Conservative internal comfort level.
   *
   * This is NOT a legal limit.
   * It is only used for UX classification.
   */
  private readonly comfortableDsti =
    35;

  calculate(
    dto:
      CalculateBankAffordabilityDto,
  ) {
    /*
     * ==========================================================
     * 1. BANK PROFILE
     * ==========================================================
     */

    const profile =
      BANK_MORTGAGE_PROFILES[
        dto.bank
      ];

    if (!profile) {
      throw new BadRequestException(
        'Unsupported mortgage bank',
      );
    }

    if (
      dto.existingMonthlyDebts >=
      dto.monthlyNetIncome
    ) {
      throw new BadRequestException(
        'Existing monthly debts cannot be equal to or greater than monthly net income',
      );
    }

    /*
     * ==========================================================
     * 2. MAX TOTAL MONTHLY DEBT
     * ==========================================================
     *
     * DSTI reference:
     *
     * total monthly debt /
     * monthly net income
     */

    const maximumTotalDebtPayment =
      dto.monthlyNetIncome *
      (
        this.maxDsti /
        100
      );

    /*
     * Amount still available for
     * a future mortgage payment.
     */

    const maximumMortgagePayment =
      Math.max(
        0,

        maximumTotalDebtPayment -
          dto.existingMonthlyDebts,
      );

    /*
     * ==========================================================
     * 3. COMFORTABLE MONTHLY MORTGAGE PAYMENT
     * ==========================================================
     */

    const comfortableTotalDebtPayment =
      dto.monthlyNetIncome *
      (
        this.comfortableDsti /
        100
      );

    const comfortableMortgagePayment =
      Math.max(
        0,

        comfortableTotalDebtPayment -
          dto.existingMonthlyDebts,
      );

    /*
     * ==========================================================
     * 4. LOAN TERM
     * ==========================================================
     */

    const totalMonths =
      dto.loanTermYears *
      12;

    /*
     * ==========================================================
     * 5. BANK RATE
     * ==========================================================
     *
     * We use the bank scenario's initial TAN.
     *
     * This gives an indicative starting
     * borrowing capacity.
     */

    const initialTan =
      profile.initialTan;

    /*
     * ==========================================================
     * 6. MAXIMUM LOAN BASED ON DSTI
     * ==========================================================
     *
     * Reverse mortgage formula:
     *
     * P =
     * M × ((1+r)^n - 1)
     * -----------------
     * r(1+r)^n
     */

    const incomeBasedMaximumLoan =
      this.calculatePrincipalFromPayment(
        maximumMortgagePayment,
        initialTan,
        totalMonths,
      );

    const comfortableLoanAmount =
      this.calculatePrincipalFromPayment(
        comfortableMortgagePayment,
        initialTan,
        totalMonths,
      );

    /*
     * ==========================================================
     * 7. MAX PROPERTY VALUE FROM LTV
     * ==========================================================
     *
     * Primary residence = 90%
     * Other purpose = 80%
     *
     * The actual mortgage flow will later
     * also require an appraisal value.
     */

    const maxLtv =
      dto.purpose ===
      PropertyPurpose.PRIMARY_RESIDENCE
        ? profile
            .maxLtvPrimaryResidence
        : profile
            .maxLtvOther;

    /*
     * If:
     *
     * Loan <= LTV% of property
     *
     * then minimum property value required
     * for a loan is:
     *
     * property =
     * loan / LTV
     */

    const minimumPropertyValueForIncomeLoan =
      incomeBasedMaximumLoan /
      (
        maxLtv /
        100
      );

    /*
     * But affordability must also respect
     * the Buyer's actual available cash.
     *
     * If LTV = 90%, buyer must generally
     * cover at least 10% from own funds.
     *
     * propertyPrice =
     * downPayment / (1 - LTV)
     */

    const downPaymentBasedMaximumProperty =
      maxLtv < 100
        ? dto.availableDownPayment /
          (
            1 -
            maxLtv /
              100
          )
        : Number.POSITIVE_INFINITY;

    const downPaymentBasedMaximumLoan =
      downPaymentBasedMaximumProperty *
      (
        maxLtv /
        100
      );

    /*
     * ==========================================================
     * 8. FINAL BORROWING CAPACITY
     * ==========================================================
     *
     * The Buyer is constrained by:
     *
     * A. income / DSTI
     * B. available down payment / LTV
     */

    const maximumLoanAmount =
      Math.max(
        0,

        Math.min(
          incomeBasedMaximumLoan,
          downPaymentBasedMaximumLoan,
        ),
      );

    /*
     * Estimated maximum property budget.
     */

    const maximumPropertyBudget =
      maximumLoanAmount +
      dto.availableDownPayment;

    /*
     * Conservative / recommended budget:
     *
     * use comfortable DSTI and available cash.
     */

    const comfortablePropertyBudget =
      Math.min(
        comfortableLoanAmount +
          dto.availableDownPayment,

        maximumPropertyBudget,
      );

    /*
     * ==========================================================
     * 9. PAYMENT FOR FINAL LOAN
     * ==========================================================
     */

    const estimatedMortgagePayment =
      this.calculateMonthlyPayment(
        maximumLoanAmount,
        initialTan,
        totalMonths,
      );

    /*
     * ==========================================================
     * 10. FINAL DSTI
     * ==========================================================
     */

    const finalDsti =
      dto.monthlyNetIncome > 0
        ? (
            (
              dto.existingMonthlyDebts +
              estimatedMortgagePayment
            ) /
            dto.monthlyNetIncome
          ) *
          100
        : 0;

    /*
     * ==========================================================
     * 11. CLASSIFICATION
     * ==========================================================
     */

    let riskLevel:
      | 'COMFORTABLE'
      | 'MODERATE'
      | 'HIGH'
      | 'ABOVE_REFERENCE';

    let riskLabel:
      string;

    if (
      finalDsti <=
      35
    ) {
      riskLevel =
        'COMFORTABLE';

      riskLabel =
        'Comfortable';
    } else if (
      finalDsti <=
      40
    ) {
      riskLevel =
        'MODERATE';

      riskLabel =
        'Moderate';
    } else if (
      finalDsti <=
      this.maxDsti
    ) {
      riskLevel =
        'HIGH';

      riskLabel =
        'High';
    } else {
      riskLevel =
        'ABOVE_REFERENCE';

      riskLabel =
        'Above reference limit';
    }

    /*
     * ==========================================================
     * 12. LIMITING FACTOR
     * ==========================================================
     */

    const limitingFactor =
      incomeBasedMaximumLoan <=
      downPaymentBasedMaximumLoan
        ? 'INCOME'
        : 'DOWN_PAYMENT';

    /*
     * ==========================================================
     * 13. RETURN
     * ==========================================================
     */

    return {
      bank:
        profile.bank,

      bankName:
        profile.bankName,

      purpose:
        dto.purpose,

      /*
       * Buyer inputs
       */

      monthlyNetIncome:
        this.round(
          dto.monthlyNetIncome,
        ),

      existingMonthlyDebts:
        this.round(
          dto.existingMonthlyDebts,
        ),

      availableDownPayment:
        this.round(
          dto.availableDownPayment,
        ),

      loanTermYears:
        dto.loanTermYears,

      totalMonths,

      /*
       * Bank scenario
       */

      initialTan:
        profile.initialTan,

      rateType:
        profile.rateType,

      referenceTaeg:
        profile.referenceTaeg,

      euriborType:
        profile.euriborType,

      euriborRate:
        profile.euriborRate,

      spread:
        profile.spread,

      /*
       * DSTI
       */

      referenceMaximumDsti:
        this.maxDsti,

      comfortableDsti:
        this.comfortableDsti,

      maximumTotalDebtPayment:
        this.round(
          maximumTotalDebtPayment,
        ),

      maximumMortgagePayment:
        this.round(
          maximumMortgagePayment,
        ),

      comfortableMortgagePayment:
        this.round(
          comfortableMortgagePayment,
        ),

      estimatedMortgagePayment:
        this.round(
          estimatedMortgagePayment,
        ),

      finalDsti:
        this.round(
          finalDsti,
        ),

      /*
       * Capacity
       */

      incomeBasedMaximumLoan:
        this.round(
          incomeBasedMaximumLoan,
        ),

      downPaymentBasedMaximumLoan:
        this.round(
          downPaymentBasedMaximumLoan,
        ),

      maximumLoanAmount:
        this.round(
          maximumLoanAmount,
        ),

      maximumPropertyBudget:
        this.round(
          maximumPropertyBudget,
        ),

      recommendedPropertyBudget:
        this.round(
          comfortablePropertyBudget,
        ),

      /*
       * LTV
       */

      maxLtv:
        this.round(
          maxLtv,
        ),

      minimumPropertyValueForIncomeLoan:
        this.round(
          minimumPropertyValueForIncomeLoan,
        ),

      /*
       * Analysis
       */

      limitingFactor,

      riskLevel,

      riskLabel,

      /*
       * Bank metadata
       */

      conditions: {
        effectiveFrom:
          profile.effectiveFrom,

        effectiveTo:
          profile.effectiveTo,

        sourceLabel:
          profile.sourceLabel,
      },

      disclaimer:
        'Indicative affordability assessment based on the selected bank scenario and general Portuguese mortgage reference limits. This is not a credit approval. Final affordability, rates, fees, insurance requirements and approval depend on the lender assessment and official FINE.',
    };
  }

  /*
   * ============================================================
   * PAYMENT -> PRINCIPAL
   * ============================================================
   */

  private calculatePrincipalFromPayment(
    monthlyPayment: number,
    annualRatePercent: number,
    months: number,
  ): number {
    if (
      monthlyPayment <= 0 ||
      months <= 0
    ) {
      return 0;
    }

    const monthlyRate =
      annualRatePercent /
      100 /
      12;

    if (
      monthlyRate === 0
    ) {
      return (
        monthlyPayment *
        months
      );
    }

    const factor =
      Math.pow(
        1 +
          monthlyRate,
        months,
      );

    return (
      monthlyPayment *
      (
        factor -
        1
      )
    ) /
      (
        monthlyRate *
        factor
      );
  }

  /*
   * ============================================================
   * PRINCIPAL -> PAYMENT
   * ============================================================
   */

  private calculateMonthlyPayment(
    principal: number,
    annualRatePercent: number,
    months: number,
  ): number {
    if (
      principal <= 0 ||
      months <= 0
    ) {
      return 0;
    }

    const monthlyRate =
      annualRatePercent /
      100 /
      12;

    if (
      monthlyRate === 0
    ) {
      return (
        principal /
        months
      );
    }

    const factor =
      Math.pow(
        1 +
          monthlyRate,
        months,
      );

    return (
      principal *
      monthlyRate *
      factor
    ) /
      (
        factor -
        1
      );
  }

  private round(
    value: number,
  ): number {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      return 0;
    }

    return (
      Math.round(
        (
          value +
          Number.EPSILON
        ) *
        100,
      ) /
      100
    );
  }
}