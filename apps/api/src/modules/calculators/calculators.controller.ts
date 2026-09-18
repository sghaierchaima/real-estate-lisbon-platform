import { Body, Controller, Post } from '@nestjs/common';
import { CalculatorsService } from './calculators.service';
import { MortgageCalculatorDto } from './dto/mortgage-calculator.dto';
import { AffordabilityCalculatorDto } from './dto/affordability-calculator.dto';
import { TrueCostCalculatorDto } from './dto/true-cost-calculator.dto';
import { BankMortgageService,} from './bank-mortgage.service';
import { CalculateBankMortgageDto,} from './dto/calculate-bank-mortgage.dto';
import { BankAffordabilityService,} from './bank-affordability.service';
import {
  BankTrueCostService,
} from './bank-true-cost.service';

import {
  CalculateBankTrueCostDto,
} from './dto/calculate-bank-true-cost.dto';

import {
  CalculateBankAffordabilityDto,
} from './dto/calculate-bank-affordability.dto';
@Controller('calculators')
export class CalculatorsController {
  constructor(private readonly calculatorsService: CalculatorsService,
    private readonly bankMortgageService:
    BankMortgageService,
    private readonly bankAffordabilityService:
    BankAffordabilityService,
    private readonly bankTrueCostService:
    BankTrueCostService,
  

  ) {}

  @Post('mortgage')
  calculateMortgage(@Body() dto: MortgageCalculatorDto) {
    return this.calculatorsService.calculateMortgage(dto);
  }

  @Post('affordability')
  calculateAffordability(@Body() dto: AffordabilityCalculatorDto) {
    return this.calculatorsService.calculateAffordability(dto);
  }

  @Post('true-cost')
  calculateTrueCost(@Body() dto: TrueCostCalculatorDto) {
    return this.calculatorsService.calculateTrueCost(dto);
  }
  @Post('mortgage/bank')
calculateBankMortgage(
  @Body()
  dto: CalculateBankMortgageDto,
) {
  return this.bankMortgageService.calculate(
    dto,
  );
}
@Post('affordability/bank')
calculateBankAffordability(
  @Body()
  dto:
    CalculateBankAffordabilityDto,
) {
  return this.bankAffordabilityService.calculate(
    dto,
  );
}

@Post('true-cost/bank')
calculateBankTrueCost(
  @Body()
  dto:
    CalculateBankTrueCostDto,
) {
  return this.bankTrueCostService.calculate(
    dto,
  );
}

}