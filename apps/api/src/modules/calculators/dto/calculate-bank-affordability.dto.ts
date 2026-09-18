import {
  IsEnum,
  IsInt,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

import {
  MortgageBank,
  PropertyPurpose,
} from '../bank-mortgage.types';

export class CalculateBankAffordabilityDto {
  @IsEnum(MortgageBank)
  bank!: MortgageBank;

  /*
   * Net household monthly income.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monthlyNetIncome!: number;

  /*
   * Existing monthly repayments:
   *
   * car loan
   * personal loan
   * credit cards
   * other financing
   */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  existingMonthlyDebts!: number;

  /*
   * Cash available for down payment.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  availableDownPayment!: number;

  /*
   * Desired loan term.
   */
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(40)
  loanTermYears!: number;

  @IsEnum(PropertyPurpose)
  purpose!: PropertyPurpose;
}