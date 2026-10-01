import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  BuyerJourneyStatus,
  FinancingType,
  PurchaseGoal,
  PurchaseTimeline,
} from '@prisma/client';

export class UpdateBuyerJourneyDto {
  @IsOptional()
  @IsEnum(PurchaseGoal)
  goal?: PurchaseGoal;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedBudget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableDeposit?: number;

  @IsOptional()
  @IsEnum(FinancingType)
  financingType?: FinancingType;

  @IsOptional()
  @IsEnum(PurchaseTimeline)
  timeline?: PurchaseTimeline;

  @IsOptional()
  @IsBoolean()
  needsMortgageBroker?: boolean;

  @IsOptional()
  @IsBoolean()
  needsPropertyLawyer?: boolean;

  @IsOptional()
  @IsBoolean()
  needsTaxAdvisor?: boolean;

  @IsOptional()
  @IsBoolean()
  needsInsuranceBroker?: boolean;

  @IsOptional()
  @IsEnum(BuyerJourneyStatus)
  status?: BuyerJourneyStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}