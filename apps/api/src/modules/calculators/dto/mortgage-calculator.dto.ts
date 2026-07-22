import { IsNumber, Min } from 'class-validator';

export class MortgageCalculatorDto {
  @IsNumber()
  @Min(1)
  propertyPrice!: number;

  @IsNumber()
  @Min(0)
  downPayment!: number;

  @IsNumber()
  @Min(0)
  interestRate!: number;

  @IsNumber()
  @Min(1)
  loanTermYears!: number;
}