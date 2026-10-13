import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
@Type(() => Number)
@IsNumber()
@Min(1)
minArea?: number;

@IsOptional()
@Type(() => Number)
@IsNumber()
@Min(1)
maxArea?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mustHave?: string[];

  @IsOptional()
  @IsString()
  aiSummary?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  confidence?: number;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}