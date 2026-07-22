import { BadRequestException, Injectable } from '@nestjs/common';
import { MortgageCalculatorDto } from './dto/mortgage-calculator.dto';
import { AffordabilityCalculatorDto } from './dto/affordability-calculator.dto';
import { TrueCostCalculatorDto } from './dto/true-cost-calculator.dto';

@Injectable()
export class CalculatorsService {
  calculateMortgage(dto: MortgageCalculatorDto) {
    if (dto.downPayment >= dto.propertyPrice) {
      throw new BadRequestException(
        'Down payment must be lower than property price',
      );
    }

    const loanAmount = dto.propertyPrice - dto.downPayment;
    const monthlyRate = dto.interestRate / 100 / 12;
    const numberOfPayments = dto.loanTermYears * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / numberOfPayments
        : (loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, numberOfPayments)) /
          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    return {
      propertyPrice: dto.propertyPrice,
      downPayment: dto.downPayment,
      loanAmount: Math.round(loanAmount),
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(totalPayment + dto.downPayment),
    };
  }

  calculateAffordability(dto: AffordabilityCalculatorDto) {
    const monthlyIncome = dto.annualIncome / 12;

    const maxDebtToIncomeRatio = 0.35;
    const maxMortgagePayment = monthlyIncome * maxDebtToIncomeRatio - dto.monthlyDebts;

    if (maxMortgagePayment <= 0) {
      return {
        maxMonthlyPayment: 0,
        recommendedMortgage: 0,
        maxPropertyPrice: dto.downPayment,
        message: 'Monthly debts are too high compared to income',
      };
    }

    const assumedInterestRate = 0.035 / 12;
    const assumedTermMonths = 30 * 12;

    const recommendedMortgage =
      (maxMortgagePayment *
        (Math.pow(1 + assumedInterestRate, assumedTermMonths) - 1)) /
      (assumedInterestRate *
        Math.pow(1 + assumedInterestRate, assumedTermMonths));

    return {
      annualIncome: dto.annualIncome,
      monthlyIncome: Math.round(monthlyIncome),
      monthlyDebts: dto.monthlyDebts,
      maxMonthlyPayment: Math.round(maxMortgagePayment),
      recommendedMortgage: Math.round(recommendedMortgage),
      maxPropertyPrice: Math.round(recommendedMortgage + dto.downPayment),
    };
  }

  calculateTrueCost(dto: TrueCostCalculatorDto) {
    const propertyPrice = dto.propertyPrice;

    const imtTax = propertyPrice * 0.05;
    const stampDuty = propertyPrice * 0.008;
    const notaryFees = 2000;
    const legalFees = propertyPrice * 0.003;
    const bankFees = 1000;

    const totalExtraCosts =
      imtTax + stampDuty + notaryFees + legalFees + bankFees;

    return {
      propertyPrice: Math.round(propertyPrice),
      imtTax: Math.round(imtTax),
      stampDuty: Math.round(stampDuty),
      notaryFees: Math.round(notaryFees),
      legalFees: Math.round(legalFees),
      bankFees: Math.round(bankFees),
      totalExtraCosts: Math.round(totalExtraCosts),
      totalCost: Math.round(propertyPrice + totalExtraCosts),
      note: 'Estimated buying costs for Portugal. Exact taxes may vary depending on buyer profile and property type.',
    };
  }
}