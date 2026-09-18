import { Module } from '@nestjs/common';
import { CalculatorsController } from './calculators.controller';
import { CalculatorsService } from './calculators.service';
import {  BankMortgageService,} from './bank-mortgage.service';
import {  BankAffordabilityService,} from './bank-affordability.service';
import {  BankTrueCostService,} from './bank-true-cost.service';
@Module({
  controllers: [CalculatorsController],
  providers: [CalculatorsService,BankMortgageService,BankAffordabilityService,BankTrueCostService,]
})
export class CalculatorsModule {}
