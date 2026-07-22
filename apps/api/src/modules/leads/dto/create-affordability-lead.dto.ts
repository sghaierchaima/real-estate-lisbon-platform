import { IsString } from 'class-validator';

export class CreateAffordabilityLeadDto {
  @IsString()
  annualIncome!: string;

  @IsString()
  monthlyDebts!: string;

  @IsString()
  downPayment!: string;

  @IsString()
  interestRate!: string;

  @IsString()
  recommendedBudget!: string;

  @IsString()
  maximumBudget!: string;

  @IsString()
  debtToIncome!: string;

  @IsString()
  riskLabel!: string;
}