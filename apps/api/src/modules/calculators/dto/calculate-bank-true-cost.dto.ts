import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
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

import {
  PurchaseRegion,
} from '../bank-true-cost.types';

export class CalculateBankTrueCostDto {
  /*
   * Purchase price agreed with seller.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  propertyPrice!: number;

  /*
   * Portuguese VPT.
   *
   * IMT normally uses the higher
   * between purchase price and VPT.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vptValue!: number;

  @IsEnum(PropertyPurpose)
  purpose!: PropertyPurpose;

  @IsEnum(PurchaseRegion)
  region:
    PurchaseRegion =
      PurchaseRegion.MAINLAND;

  /*
   * Mortgage financing.
   */
  @IsEnum(MortgageBank)
  bank!: MortgageBank;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  loanAmount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  loanTermYears!: number;

  /*
   * These costs depend on the buyer's
   * chosen professionals and transaction.
   *
   * We therefore DO NOT pretend they
   * are official fixed government costs.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  legalFees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  registrationNotaryFees?: number;
}