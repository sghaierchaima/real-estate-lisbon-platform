import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import {
  FinancingType,
  PurchaseGoal,
  PurchaseTimeline,
} from '@prisma/client';

export class CreateBuyerJourneyDto {
  @IsUUID()
  propertyId!: string;

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
  @IsString()
  notes?: string;
}