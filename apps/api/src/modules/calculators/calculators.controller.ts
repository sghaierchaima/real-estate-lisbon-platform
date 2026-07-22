import { Body, Controller, Post } from '@nestjs/common';
import { CalculatorsService } from './calculators.service';
import { MortgageCalculatorDto } from './dto/mortgage-calculator.dto';
import { AffordabilityCalculatorDto } from './dto/affordability-calculator.dto';
import { TrueCostCalculatorDto } from './dto/true-cost-calculator.dto';

@Controller('calculators')
export class CalculatorsController {
  constructor(private readonly calculatorsService: CalculatorsService) {}

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
}