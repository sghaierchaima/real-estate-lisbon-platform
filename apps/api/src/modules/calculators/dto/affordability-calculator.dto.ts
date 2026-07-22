import { IsNumber, Min } from 'class-validator';

export class AffordabilityCalculatorDto {
  @IsNumber()
  @Min(1)
  annualIncome!: number;

  @IsNumber()
  @Min(0)
  monthlyDebts!: number;

  @IsNumber()
  @Min(0)
  downPayment!: number;
}