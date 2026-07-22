import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCalculatorLeadDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  source!: string;

  @IsOptional()
  @IsString()
  interest?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  budget?: string;
}