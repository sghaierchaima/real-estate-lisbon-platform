import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  BANK_ACQUISITION_COSTS,
} from './bank-acquisition-cost.config';

import {
  PropertyPurpose,
} from './bank-mortgage.types';

import {
  CalculateBankTrueCostDto,
} from './dto/calculate-bank-true-cost.dto';

@Injectable()
export class BankTrueCostService {
  /*
   * ============================================================
   * PORTUGAL — ACQUISITION STAMP DUTY
   * ============================================================
   *
   * Acquisition of property:
   * 0.8%
   */
  private readonly acquisitionStampDutyRate =
    0.008;

  /*
   * ============================================================
   * CALCULATE
   * ============================================================
   */

  calculate(
    dto:
      CalculateBankTrueCostDto,
  ) {
    const bankProfile =
      BANK_ACQUISITION_COSTS[
        dto.bank
      ];

    if (!bankProfile) {
      throw new BadRequestException(
        'Unsupported mortgage bank',
      );
    }

    if (
      dto.loanAmount >
      dto.propertyPrice
    ) {
      throw new BadRequestException(
        'Loan amount cannot exceed property price',
      );
    }

    /*
     * ==========================================================
     * 1. TAXABLE PROPERTY VALUE
     * ==========================================================
     *
     * IMT and property acquisition
     * Stamp Duty use, in general,
     * the higher value between:
     *
     * - purchase price
     * - VPT
     */

    const taxablePropertyValue =
      Math.max(
        dto.propertyPrice,
        dto.vptValue,
      );

    /*
     * ==========================================================
     * 2. IMT
     * ==========================================================
     */

    const imtTax =
      this.calculateImt(
        taxablePropertyValue,
        dto.purpose,
      );

    /*
     * ==========================================================
     * 3. ACQUISITION STAMP DUTY
     * ==========================================================
     *
     * 0.8%
     */

    const acquisitionStampDuty =
      taxablePropertyValue *
      this.acquisitionStampDutyRate;

    /*
     * ==========================================================
     * 4. MORTGAGE / CREDIT STAMP DUTY
     * ==========================================================
     */

    const mortgageStampDutyRate =
      this.getMortgageStampDutyRate(
        dto.loanTermYears,
      );

    const mortgageStampDuty =
      dto.loanAmount *
      mortgageStampDutyRate;

    /*
     * ==========================================================
     * 5. BANK COMMISSIONS
     * ==========================================================
     */

    const dossierOrStudyFee =
      bankProfile
        .dossierOrStudyFee;

    const appraisalFee =
      bankProfile
        .appraisalFee;

    const formalizationFee =
      bankProfile
        .formalizationFee;

    const bankFeesBeforeTax =
      dossierOrStudyFee +
      appraisalFee +
      formalizationFee;

    /*
     * Stamp Duty on bank commissions:
     * 4%
     */

    const bankCommissionStampDuty =
      bankFeesBeforeTax *
      bankProfile
        .commissionStampDutyRate;

    const bankFeesTotal =
      bankFeesBeforeTax +
      bankCommissionStampDuty;

    /*
     * ==========================================================
     * 6. OPTIONAL PROFESSIONAL / TRANSACTION COSTS
     * ==========================================================
     */

    const legalFees =
      dto.legalFees ??
      0;

    const registrationNotaryFees =
      dto.registrationNotaryFees ??
      0;

    /*
     * ==========================================================
     * 7. TAX TOTAL
     * ==========================================================
     */

    const governmentTaxes =
      imtTax +
      acquisitionStampDuty +
      mortgageStampDuty;

    /*
     * ==========================================================
     * 8. EXTRA PURCHASE COSTS
     * ==========================================================
     */

    const totalExtraCosts =
      governmentTaxes +
      bankFeesTotal +
      legalFees +
      registrationNotaryFees;

    /*
     * ==========================================================
     * 9. TOTAL ACQUISITION COST
     * ==========================================================
     */

    const estimatedTotalAcquisitionCost =
      dto.propertyPrice +
      totalExtraCosts;

    /*
     * ==========================================================
     * 10. BUYER CASH REQUIRED
     * ==========================================================
     *
     * Purchase price
     * minus mortgage
     * plus acquisition costs.
     */

    const purchaseEquity =
      dto.propertyPrice -
      dto.loanAmount;

    const estimatedCashRequired =
      purchaseEquity +
      totalExtraCosts;

    /*
     * ==========================================================
     * 11. COST PERCENTAGE
     * ==========================================================
     */

    const extraCostPercentage =
      dto.propertyPrice > 0
        ? (
            totalExtraCosts /
            dto.propertyPrice
          ) *
          100
        : 0;

    /*
     * ==========================================================
     * RETURN
     * ==========================================================
     */

    return {
      /*
       * Property
       */

      propertyPrice:
        this.round(
          dto.propertyPrice,
        ),

      vptValue:
        this.round(
          dto.vptValue,
        ),

      taxablePropertyValue:
        this.round(
          taxablePropertyValue,
        ),

      purpose:
        dto.purpose,

      /*
       * Financing
       */

      bank:
        bankProfile.bank,

      bankName:
        bankProfile.bankName,

      loanAmount:
        this.round(
          dto.loanAmount,
        ),

      loanTermYears:
        dto.loanTermYears,

      purchaseEquity:
        this.round(
          purchaseEquity,
        ),

      /*
       * Portuguese taxes
       */

      imtTax:
        this.round(
          imtTax,
        ),

      acquisitionStampDutyRate:
        this.acquisitionStampDutyRate *
        100,

      acquisitionStampDuty:
        this.round(
          acquisitionStampDuty,
        ),

      mortgageStampDutyRate:
        mortgageStampDutyRate *
        100,

      mortgageStampDuty:
        this.round(
          mortgageStampDuty,
        ),

      governmentTaxes:
        this.round(
          governmentTaxes,
        ),

      /*
       * Bank costs
       */

      bankFees: {
        dossierOrStudyFee:
          this.round(
            dossierOrStudyFee,
          ),

        appraisalFee:
          this.round(
            appraisalFee,
          ),

        formalizationFee:
          this.round(
            formalizationFee,
          ),

        feesBeforeTax:
          this.round(
            bankFeesBeforeTax,
          ),

        commissionStampDutyRate:
          bankProfile
            .commissionStampDutyRate *
          100,

        commissionStampDuty:
          this.round(
            bankCommissionStampDuty,
          ),

        total:
          this.round(
            bankFeesTotal,
          ),
      },

      /*
       * User-supplied estimates
       */

      legalFees:
        this.round(
          legalFees,
        ),

      registrationNotaryFees:
        this.round(
          registrationNotaryFees,
        ),

      /*
       * Totals
       */

      totalExtraCosts:
        this.round(
          totalExtraCosts,
        ),

      extraCostPercentage:
        this.round(
          extraCostPercentage,
        ),

      estimatedTotalAcquisitionCost:
        this.round(
          estimatedTotalAcquisitionCost,
        ),

      estimatedCashRequired:
        this.round(
          estimatedCashRequired,
        ),

      /*
       * Source metadata
       */

      conditions: {
        bankEffectiveFrom:
          bankProfile
            .effectiveFrom,

        bankSourceLabel:
          bankProfile
            .sourceLabel,

        taxYear:
          2026,

        jurisdiction:
          'Portugal Mainland',
      },

      disclaimer:
        'Indicative acquisition-cost simulation based on 2026 Portuguese tax rules and the selected bank fee configuration. Legal, registration, insurance and other transaction costs may vary. Final taxes must be confirmed with the Portuguese Tax Authority and final bank costs with the lender/FINE.',
    };
  }

  /*
   * ============================================================
   * IMT — PORTUGAL MAINLAND 2026
   * ============================================================
   */

  private calculateImt(
    taxableValue: number,
    purpose:
      PropertyPurpose,
  ): number {
    if (
      purpose ===
      PropertyPurpose.PRIMARY_RESIDENCE
    ) {
      return this
        .calculatePrimaryResidenceImt(
          taxableValue,
        );
    }

    return this
      .calculateOtherHousingImt(
        taxableValue,
      );
  }

  /*
   * ============================================================
   * PRIMARY RESIDENCE
   * ============================================================
   *
   * 2026 Mainland standard table.
   */

  private calculatePrimaryResidenceImt(
    value: number,
  ): number {
    /*
     * Above this level the official
     * table uses a single rate.
     */

    if (
      value >
      1_150_853
    ) {
      return (
        value *
        0.075
      );
    }

    if (
      value >
      660_982
    ) {
      return (
        value *
        0.06
      );
    }

    const brackets = [
      {
        from:
          0,

        to:
          106_346,

        rate:
          0,
      },

      {
        from:
          106_346,

        to:
          145_470,

        rate:
          0.02,
      },

      {
        from:
          145_470,

        to:
          198_347,

        rate:
          0.05,
      },

      {
        from:
          198_347,

        to:
          330_539,

        rate:
          0.07,
      },

      {
        from:
          330_539,

        to:
          660_982,

        rate:
          0.08,
      },
    ];

    return this
      .calculateProgressiveTax(
        value,
        brackets,
      );
  }

  /*
   * ============================================================
   * SECOND HOME / INVESTMENT HOUSING
   * ============================================================
   */

  private calculateOtherHousingImt(
    value: number,
  ): number {
    if (
      value >
      1_150_853
    ) {
      return (
        value *
        0.075
      );
    }

    if (
      value >
      633_931
    ) {
      return (
        value *
        0.06
      );
    }

    const brackets = [
      {
        from:
          0,

        to:
          106_346,

        rate:
          0.01,
      },

      {
        from:
          106_346,

        to:
          145_470,

        rate:
          0.02,
      },

      {
        from:
          145_470,

        to:
          198_347,

        rate:
          0.05,
      },

      {
        from:
          198_347,

        to:
          330_539,

        rate:
          0.07,
      },

      {
        from:
          330_539,

        to:
          633_931,

        rate:
          0.08,
      },
    ];

    return this
      .calculateProgressiveTax(
        value,
        brackets,
      );
  }

  /*
   * ============================================================
   * GENERIC PROGRESSIVE TAX ENGINE
   * ============================================================
   */

  private calculateProgressiveTax(
    value: number,

    brackets: Array<{
      from: number;
      to: number;
      rate: number;
    }>,
  ): number {
    let tax =
      0;

    for (
      const bracket
      of brackets
    ) {
      if (
        value <=
        bracket.from
      ) {
        break;
      }

      const taxableInBracket =
        Math.min(
          value,
          bracket.to,
        ) -
        bracket.from;

      if (
        taxableInBracket >
        0
      ) {
        tax +=
          taxableInBracket *
          bracket.rate;
      }
    }

    return tax;
  }

  /*
   * ============================================================
   * CREDIT STAMP DUTY
   * ============================================================
   */

  private getMortgageStampDutyRate(
    loanTermYears:
      number,
  ): number {
    if (
      loanTermYears >
      5
    ) {
      return 0.006;
    }

    if (
      loanTermYears >=
      1
    ) {
      return 0.005;
    }

    /*
     * Not normally reached because
     * this calculator uses years.
     */
    return 0.0004;
  }

  private round(
    value:
      number,
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