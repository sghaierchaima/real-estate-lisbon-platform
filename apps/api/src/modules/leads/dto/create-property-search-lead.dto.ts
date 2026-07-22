import { IsOptional, IsString } from 'class-validator';

export class CreatePropertySearchLeadDto {
  @IsString()
  searchText!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  bedrooms?: string;

  @IsOptional()
  @IsString()
  goal?: string;
}