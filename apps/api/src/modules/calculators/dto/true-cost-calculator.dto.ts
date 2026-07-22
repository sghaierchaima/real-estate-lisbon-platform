import { IsNumber, Min } from 'class-validator';

export class TrueCostCalculatorDto {
  @IsNumber()
  @Min(1)
  propertyPrice!: number;
}