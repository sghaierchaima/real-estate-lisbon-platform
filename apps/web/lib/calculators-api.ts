import { apiFetch } from "./api";

export type MortgagePayload = {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
};

export type AffordabilityPayload = {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
};

export type TrueCostPayload = {
  propertyPrice: number;
};

export function calculateMortgage(payload: MortgagePayload) {
  return apiFetch<{
    propertyPrice: number;
    downPayment: number;
    loanAmount: number;
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
  }>("/calculators/mortgage", {
    method: "POST",
    body: payload,
  });
}

export function calculateAffordability(payload: AffordabilityPayload) {
  return apiFetch<{
    annualIncome: number;
    monthlyIncome: number;
    monthlyDebts: number;
    maxMonthlyPayment: number;
    recommendedMortgage: number;
    maxPropertyPrice: number;
    message?: string;
  }>("/calculators/affordability", {
    method: "POST",
    body: payload,
  });
}

export function calculateTrueCost(payload: TrueCostPayload) {
  return apiFetch<{
    propertyPrice: number;
    imtTax: number;
    stampDuty: number;
    notaryFees: number;
    legalFees: number;
    bankFees: number;
    totalExtraCosts: number;
    totalCost: number;
    note: string;
  }>("/calculators/true-cost", {
    method: "POST",
    body: payload,
  });
}



export type MortgageBank =
  | "SANTANDER"
  | "CGD";

export type PropertyPurpose =
  | "PRIMARY_RESIDENCE"
  | "SECOND_HOME"
  | "INVESTMENT";

export type BankMortgageRequest = {
  bank: MortgageBank;

  propertyPrice: number;

  appraisalValue: number;

  downPayment: number;

  loanTermYears: number;

  purpose: PropertyPurpose;
};

export type BankMortgageResult = {
  bank: MortgageBank;

  bankName: string;

  rateType: string;

  purpose: PropertyPurpose;

  propertyPrice: number;

  appraisalValue: number;

  referencePropertyValue: number;

  downPayment: number;

  loanAmount: number;

  loanTermYears: number;

  totalMonths: number;

  ltv: number;

  maxLtv: number;

  ltvEligible: boolean;

  suggestedMinimumDownPayment: number;

  additionalDownPaymentNeeded: number;

  initialTan: number;

  initialMonthlyPayment: number;

  fixedPeriodMonths: number;

  fixedPeriodYears: number;

  balanceAfterFixedPeriod: number;

  euriborType?: string;

  euriborRate?: number;

  spread?: number;

  variableTan: number;

  estimatedVariablePayment: number;

  estimatedInterest: number;

  estimatedTotalPayments: number;

  referenceTaeg?: number;

  conditions: {
    effectiveFrom: string;

    effectiveTo?: string;

    sourceLabel: string;
  };

  eligibility: {
    ltvEligible: boolean;

    message: string;

    suggestedMinimumDownPayment: number;

    additionalDownPaymentNeeded: number;
  };

  disclaimer: string;
};
export function calculateBankMortgage(
  payload: BankMortgageRequest,
) {
  return apiFetch<BankMortgageResult>(
    "/calculators/mortgage/bank",
    {
      method: "POST",

      body: payload,
    },
  );
}

export type BankAffordabilityRequest = {
  bank:
    | "SANTANDER"
    | "CGD";

  monthlyNetIncome:
    number;

  existingMonthlyDebts:
    number;

  availableDownPayment:
    number;

  loanTermYears:
    number;

  purpose:
    | "PRIMARY_RESIDENCE"
    | "SECOND_HOME"
    | "INVESTMENT";
};

export type BankAffordabilityResult = {
  bank:
    | "SANTANDER"
    | "CGD";

  bankName:
    string;

  purpose:
    PropertyPurpose;

  monthlyNetIncome:
    number;

  existingMonthlyDebts:
    number;

  availableDownPayment:
    number;

  loanTermYears:
    number;

  totalMonths:
    number;

  initialTan:
    number;

  rateType:
    string;

  referenceTaeg?: number;

  euriborType?: string;

  euriborRate?: number;

  spread?: number;

  referenceMaximumDsti:
    number;

  comfortableDsti:
    number;

  maximumTotalDebtPayment:
    number;

  maximumMortgagePayment:
    number;

  comfortableMortgagePayment:
    number;

  estimatedMortgagePayment:
    number;

  finalDsti:
    number;

  incomeBasedMaximumLoan:
    number;

  downPaymentBasedMaximumLoan:
    number;

  maximumLoanAmount:
    number;

  maximumPropertyBudget:
    number;

  recommendedPropertyBudget:
    number;

  maxLtv:
    number;

  minimumPropertyValueForIncomeLoan:
    number;

  limitingFactor:
    "INCOME" |
    "DOWN_PAYMENT";

  riskLevel:
    | "COMFORTABLE"
    | "MODERATE"
    | "HIGH"
    | "ABOVE_REFERENCE";

  riskLabel:
    string;

  conditions: {
    effectiveFrom:
      string;

    effectiveTo?:
      string;

    sourceLabel:
      string;
  };

  disclaimer:
    string;
};

export function calculateBankAffordability(
  payload:
    BankAffordabilityRequest,
) {
  return apiFetch<BankAffordabilityResult>(
    "/calculators/affordability/bank",
    {
      method:
        "POST",

      body:
        payload,
    },
  );
}

export type BankTrueCostRequest = {
  propertyPrice:
    number;

  vptValue:
    number;

  purpose:
    PropertyPurpose;

  region:
    "MAINLAND";

  bank:
    MortgageBank;

  loanAmount:
    number;

  loanTermYears:
    number;

  legalFees?:
    number;

  registrationNotaryFees?:
    number;
};

export type BankTrueCostResult = {
  propertyPrice:
    number;

  vptValue:
    number;

  taxablePropertyValue:
    number;

  purpose:
    PropertyPurpose;

  bank:
    MortgageBank;

  bankName:
    string;

  loanAmount:
    number;

  loanTermYears:
    number;

  purchaseEquity:
    number;

  imtTax:
    number;

  acquisitionStampDutyRate:
    number;

  acquisitionStampDuty:
    number;

  mortgageStampDutyRate:
    number;

  mortgageStampDuty:
    number;

  governmentTaxes:
    number;

  bankFees: {
    dossierOrStudyFee:
      number;

    appraisalFee:
      number;

    formalizationFee:
      number;

    feesBeforeTax:
      number;

    commissionStampDutyRate:
      number;

    commissionStampDuty:
      number;

    total:
      number;
  };

  legalFees:
    number;

  registrationNotaryFees:
    number;

  totalExtraCosts:
    number;

  extraCostPercentage:
    number;

  estimatedTotalAcquisitionCost:
    number;

  estimatedCashRequired:
    number;

  conditions: {
    bankEffectiveFrom:
      string;

    bankSourceLabel:
      string;

    taxYear:
      number;

    jurisdiction:
      string;
  };

  disclaimer:
    string;
};

export function calculateBankTrueCost(
  payload:
    BankTrueCostRequest,
) {
  return apiFetch<
    BankTrueCostResult
  >(
    "/calculators/true-cost/bank",
    {
      method:
        "POST",

      body:
        payload,
    },
  );
}