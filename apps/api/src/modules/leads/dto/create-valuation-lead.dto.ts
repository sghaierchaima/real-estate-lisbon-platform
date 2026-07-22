import { IsOptional, IsString } from 'class-validator';

export class CreateValuationLeadDto {
  @IsString()
  address!: string;

  @IsString()
  propertyType!: string;

  @IsString()
  condition!: string;

  @IsString()
  size!: string;

  @IsString()
  askingPrice!: string;

  @IsOptional()
  @IsString()
  bedrooms?: string;

  @IsOptional()
  @IsString()
  bathrooms?: string;

  @IsOptional()
  @IsString()
  floorLevel?: string;

  @IsString()
  estimatedValue!: string;

  @IsString()
  valuationRange!: string;

  @IsString()
  verdict!: string;
}