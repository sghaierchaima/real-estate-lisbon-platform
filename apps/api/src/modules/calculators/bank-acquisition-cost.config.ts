import {
  MortgageBank,
} from './bank-mortgage.types';

export type BankAcquisitionCostProfile = {
  bank:
    MortgageBank;

  bankName:
    string;

  dossierOrStudyFee:
    number;

  appraisalFee:
    number;

  formalizationFee:
    number;

  commissionStampDutyRate:
    number;

  effectiveFrom:
    string;

  sourceLabel:
    string;
};

export const BANK_ACQUISITION_COSTS:
  Record<
    MortgageBank,
    BankAcquisitionCostProfile
  > = {
    SANTANDER: {
      bank:
        MortgageBank.SANTANDER,

      bankName:
        'Santander Portugal',

      /*
       * Standard Crédito Habitação
       * current published tariff.
       */
      dossierOrStudyFee:
        280,

      appraisalFee:
        230,

      /*
       * Casa Pronta / Notary scenario.
       */
      formalizationFee:
        224,

      /*
       * Portuguese Stamp Duty
       * charged on bank commissions.
       */
      commissionStampDutyRate:
        0.04,

      effectiveFrom:
        '2026-01-01',

      sourceLabel:
        'Banco Santander Totta 2026 published price list',
    },

    CGD: {
      bank:
        MortgageBank.CGD,

      bankName:
        'Caixa Geral de Depósitos',

      dossierOrStudyFee:
        290,

      appraisalFee:
        230,

      formalizationFee:
        195,

      commissionStampDutyRate:
        0.04,

      effectiveFrom:
        '2026-05-28',

      sourceLabel:
        'Caixa Geral de Depósitos 2026 published price list',
    },
  };