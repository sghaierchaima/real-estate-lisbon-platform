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