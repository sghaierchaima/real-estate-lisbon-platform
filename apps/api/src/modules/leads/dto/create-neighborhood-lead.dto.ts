import { IsOptional, IsString } from 'class-validator';

export class CreateNeighborhoodLeadDto {
  @IsString()
  neighborhoodId!: string;

  @IsString()
  neighborhoodName!: string;

  @IsOptional()
  @IsString()
  budgetMin?: string;

  @IsOptional()
  @IsString()
  budgetMax?: string;

  @IsString()
  profile!: string;

  @IsString()
  goal!: string;
}