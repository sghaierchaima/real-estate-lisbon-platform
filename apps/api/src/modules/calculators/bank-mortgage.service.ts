import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  BANK_MORTGAGE_PROFILES,
} from './bank-mortgage.config';

import {
  MortgageBank,
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  CalculateBankMortgageDto,
} from './dto/calculate-bank-mortgage.dto';

@Injectable()
export class BankMortgageService {
  calculate(
    dto: CalculateBankMortgageDto,
  ) {
    /*
     * ==========================================================
     * 1. BANK CONFIGURATION
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

    /*
     * ==========================================================
     * 2. BASIC VALUES
     * ==========================================================
     */

    const loanAmount =
      dto.propertyPrice -
      dto.downPayment;

    if (loanAmount <= 0) {
      throw new BadRequestException(
        'Down payment must be lower than the property price',
      );
    }

    if (
      dto.appraisalValue <= 0
    ) {
      throw new BadRequestException(
        'Appraisal value must be greater than zero',
      );
    }

    /*
     * Mortgage LTV reference value:
     *
     * minimum of:
     * - property purchase price
     * - appraisal value
     */

    const referencePropertyValue =
      Math.min(
        dto.propertyPrice,
        dto.appraisalValue,
      );

    /*
     * ==========================================================
     * 3. LTV
     * ==========================================================
     */

    const ltv =
      (
        loanAmount /
        referencePropertyValue
      ) *
      100;

    const maxLtv =
      dto.purpose ===
      PropertyPurpose.PRIMARY_RESIDENCE
        ? profile
            .maxLtvPrimaryResidence
        : profile
            .maxLtvOther;

    const ltvEligible =
      ltv <= maxLtv;

    /*
     * Suggested minimum down payment
     * for this LTV limit.
     */

    const maximumLoanAmount =
      referencePropertyValue *
      (maxLtv / 100);

    const suggestedMinimumDownPayment =
      Math.max(
        0,
        dto.propertyPrice -
          maximumLoanAmount,
      );

    const additionalDownPaymentNeeded =
      Math.max(
        0,
        suggestedMinimumDownPayment -
          dto.downPayment,
      );

    /*
     * ==========================================================
     * 4. LOAN TERM
     * ==========================================================
     */

    const totalMonths =
      dto.loanTermYears *
      12;

    const fixedPeriodMonths =
      Math.min(
        profile.fixedPeriodMonths ??
          0,
        totalMonths,
      );

    /*
     * ==========================================================
     * 5. FIXED / INITIAL PERIOD
     * ==========================================================
     */

    const initialMonthlyPayment =
      this.calculateMonthlyPayment(
        loanAmount,
        profile.initialTan,
        totalMonths,
      );

    /*
     * ==========================================================
     * 6. OUTSTANDING CAPITAL AFTER FIXED PERIOD
     * ==========================================================
     */

    const balanceAfterFixedPeriod =
      this.calculateOutstandingBalance(
        loanAmount,
        profile.initialTan,
        totalMonths,
        fixedPeriodMonths,
        initialMonthlyPayment,
      );

    /*
     * ==========================================================
     * 7. VARIABLE PERIOD
     * ==========================================================
     *
     * Important:
     *
     * This is an estimate using today's/reference
     * variable TAN stored in the Bank Profile.
     *
     * Future Euribor values are unknown.
     */

    const remainingMonths =
      totalMonths -
      fixedPeriodMonths;

    const variableTan =
      profile.variableTan ??
      profile.initialTan;

    const estimatedVariablePayment =
      remainingMonths > 0
        ? this.calculateMonthlyPayment(
            balanceAfterFixedPeriod,
            variableTan,
            remainingMonths,
          )
        : initialMonthlyPayment;

    /*
     * ==========================================================
     * 8. TOTAL PAYMENT ESTIMATE
     * ==========================================================
     */

    const fixedPeriodPayments =
      initialMonthlyPayment *
      fixedPeriodMonths;

    const variablePeriodPayments =
      estimatedVariablePayment *
      remainingMonths;

    const estimatedTotalPayments =
      fixedPeriodPayments +
      variablePeriodPayments;

    const estimatedInterest =
      Math.max(
        0,
        estimatedTotalPayments -
          loanAmount,
      );

    /*
     * ==========================================================
     * 9. RETURN
     * ==========================================================
     */

    return {
      bank:
        profile.bank,

      bankName:
        profile.bankName,

      rateType:
        profile.rateType,

      purpose:
        dto.purpose,

      propertyPrice:
        this.round(
          dto.propertyPrice,
        ),

      appraisalValue:
        this.round(
          dto.appraisalValue,
        ),

      referencePropertyValue:
        this.round(
          referencePropertyValue,
        ),

      downPayment:
        this.round(
          dto.downPayment,
        ),

      loanAmount:
        this.round(
          loanAmount,
        ),

      loanTermYears:
        dto.loanTermYears,

      totalMonths,

      /*
       * LTV
       */

      ltv:
        this.round(ltv),

      maxLtv:
        this.round(maxLtv),

      ltvEligible,

      suggestedMinimumDownPayment:
        this.round(
          suggestedMinimumDownPayment,
        ),

      additionalDownPaymentNeeded:
        this.round(
          additionalDownPaymentNeeded,
        ),

      /*
       * Initial / fixed period
       */

      initialTan:
        profile.initialTan,

      initialMonthlyPayment:
        this.round(
          initialMonthlyPayment,
        ),

      fixedPeriodMonths,

      fixedPeriodYears:
        this.round(
          fixedPeriodMonths /
            12,
        ),

      balanceAfterFixedPeriod:
        this.round(
          balanceAfterFixedPeriod,
        ),

      /*
       * Variable period
       */

      euriborType:
        profile.euriborType,

      euriborRate:
        profile.euriborRate,

      spread:
        profile.spread,

      variableTan,

      estimatedVariablePayment:
        this.round(
          estimatedVariablePayment,
        ),

      /*
       * Estimates
       */

      estimatedInterest:
        this.round(
          estimatedInterest,
        ),

      estimatedTotalPayments:
        this.round(
          estimatedTotalPayments,
        ),

      /*
       * This is NOT the Buyer's calculated TAEG.
       *
       * It is the bank representative example
       * stored in our configuration.
       */

      referenceTaeg:
        profile.referenceTaeg,

      /*
       * Source metadata
       */

      conditions: {
        effectiveFrom:
          profile.effectiveFrom,

        effectiveTo:
          profile.effectiveTo,

        sourceLabel:
          profile.sourceLabel,
      },

      /*
       * UX information
       */

      eligibility: {
        ltvEligible,

        message:
          ltvEligible
            ? `The requested financing is within the ${maxLtv}% reference LTV limit.`
            : `The requested financing exceeds the ${maxLtv}% reference LTV limit.`,

        suggestedMinimumDownPayment:
          this.round(
            suggestedMinimumDownPayment,
          ),

        additionalDownPaymentNeeded:
          this.round(
            additionalDownPaymentNeeded,
          ),
      },

      disclaimer:
        'Indicative simulation based on publicly available bank conditions. Variable-rate payments may change with Euribor. Final rates, spread, fees, insurance costs, approval and FINE depend on the bank assessment.',
    };
  }

  /*
   * ============================================================
   * STANDARD MORTGAGE AMORTIZATION FORMULA
   * ============================================================
   *
   * M = P × r(1+r)^n / ((1+r)^n - 1)
   *
   * P = principal
   * r = monthly interest rate
   * n = remaining payments
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

    if (monthlyRate === 0) {
      return (
        principal /
        months
      );
    }

    const factor =
      Math.pow(
        1 + monthlyRate,
        months,
      );

    return (
      principal *
      (
        monthlyRate *
        factor
      ) /
      (
        factor -
        1
      )
    );
  }

  /*
   * ============================================================
   * OUTSTANDING BALANCE
   * ============================================================
   *
   * Calculates remaining capital after X payments.
   */

  private calculateOutstandingBalance(
    principal: number,
    annualRatePercent: number,
    totalMonths: number,
    paidMonths: number,
    monthlyPayment: number,
  ): number {
    if (
      paidMonths <= 0
    ) {
      return principal;
    }

    if (
      paidMonths >=
      totalMonths
    ) {
      return 0;
    }

    const monthlyRate =
      annualRatePercent /
      100 /
      12;

    if (monthlyRate === 0) {
      return Math.max(
        0,
        principal -
          monthlyPayment *
            paidMonths,
      );
    }

    const growth =
      Math.pow(
        1 + monthlyRate,
        paidMonths,
      );

    const balance =
      principal *
        growth -
      monthlyPayment *
        (
          (growth - 1) /
          monthlyRate
        );

    return Math.max(
      0,
      balance,
    );
  }

  /*
   * ============================================================
   * ROUND MONEY / PERCENTAGES
   * ============================================================
   */

  private round(
    value: number,
  ): number {
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