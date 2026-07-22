import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProfessionalType, VerificationStatus } from '@prisma/client';

export class CreateProfessionalDto {
  @IsString()
  userId!: string;

  @IsEnum(ProfessionalType)
  professionalType!: ProfessionalType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  reviewsCount?: number;

  @IsOptional()
  @IsNumber()
  clientsCount?: number;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  profileCompletion?: number;
}