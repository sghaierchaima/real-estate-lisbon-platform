import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  buyerId!: string;

  @IsString()
  professionalId!: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}