import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeadQuality, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  interest?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsEnum(LeadQuality)
  quality?: LeadQuality;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}