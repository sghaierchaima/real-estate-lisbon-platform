import {
  BankMortgageProfile,
  MortgageBank,
  MortgageRateType,
} from './bank-mortgage.types';

export const BANK_MORTGAGE_PROFILES:
  Record<MortgageBank, BankMortgageProfile> = {

  [MortgageBank.SANTANDER]: {
    bank:
      MortgageBank.SANTANDER,

    bankName:
      'Santander Portugal',

    rateType:
      MortgageRateType.MIXED,

    initialTan:
      2.8,

    fixedPeriodMonths:
      24,

    euriborType:
      '6M',

    euriborRate:
      2.596,

    spread:
      0.8,

    variableTan:
      3.396,

    referenceTaeg:
      3.9,

    maxLtvPrimaryResidence:
      90,

    maxLtvOther:
      80,

    effectiveFrom:
      '2026-07-01',

    effectiveTo:
      '2026-09-30',

    sourceLabel:
      'Santander Portugal published mortgage conditions',
  },

  [MortgageBank.CGD]: {
    bank:
      MortgageBank.CGD,

    bankName:
      'Caixa Geral de Depósitos',

    rateType:
      MortgageRateType.MIXED,

    initialTan:
      2.6,

    fixedPeriodMonths:
      24,

    euriborType:
      '6M',

    euriborRate:
      2.596,

    spread:
      0.85,

    variableTan:
      3.446,

    referenceTaeg:
      4.0,

    maxLtvPrimaryResidence:
      90,

    maxLtvOther:
      80,

    effectiveFrom:
      '2026-06-01',

    sourceLabel:
      'CGD published mortgage conditions',
  },
};