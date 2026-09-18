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

export class CalculateBankMortgageDto {
  @IsEnum(MortgageBank)
  bank!: MortgageBank;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  propertyPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downPayment!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  appraisalValue!: number;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(40)
  loanTermYears!: number;

  @IsEnum(PropertyPurpose)
  purpose!: PropertyPurpose;
}