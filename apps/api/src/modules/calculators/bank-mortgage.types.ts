export enum MortgageBank {
  SANTANDER = 'SANTANDER',
  CGD = 'CGD',
}

export enum MortgageRateType {
  MIXED = 'MIXED',
  VARIABLE = 'VARIABLE',
  FIXED = 'FIXED',
}

export enum PropertyPurpose {
  PRIMARY_RESIDENCE = 'PRIMARY_RESIDENCE',
  SECOND_HOME = 'SECOND_HOME',
  INVESTMENT = 'INVESTMENT',
}

export type BankMortgageProfile = {
  bank: MortgageBank;

  bankName: string;

  rateType: MortgageRateType;

  initialTan: number;

  fixedPeriodMonths?: number;

  euriborType?: '6M';

  euriborRate?: number;

  spread?: number;

  variableTan?: number;

  referenceTaeg?: number;

  maxLtvPrimaryResidence: number;

  maxLtvOther: number;

  effectiveFrom: string;

  effectiveTo?: string;

  sourceLabel: string;
};