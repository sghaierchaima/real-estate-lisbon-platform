import { IsString } from 'class-validator';

export class CreateTrueCostLeadDto {
  @IsString()
  propertyPrice!: string;

  @IsString()
  imtTax!: string;

  @IsString()
  stampDuty!: string;

  @IsString()
  notaryFees!: string;

  @IsString()
  legalFees!: string;

  @IsString()
  bankFees!: string;

  @IsString()
  totalExtraCosts!: string;

  @IsString()
  totalCost!: string;
}