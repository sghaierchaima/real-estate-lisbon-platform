import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  landArea?: number;

  @IsOptional()
  @IsNumber()
  constructionYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}