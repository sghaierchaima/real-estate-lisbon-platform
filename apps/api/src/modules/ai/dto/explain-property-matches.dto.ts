import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PropertyMatchDto {
  @IsString()
  title!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  matchScore!: number;
}

export class ExplainPropertyMatchesDto {
  @IsString()
  searchText!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyMatchDto)
  properties!: PropertyMatchDto[];
}