import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProfessionalType } from '@prisma/client';
export class CreateProfessionalApplicationDto {
  @IsEnum(ProfessionalType)
  professionalType!: ProfessionalType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(1500)
  bio?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({
    each: true,
  })
  languages!: string[];
}