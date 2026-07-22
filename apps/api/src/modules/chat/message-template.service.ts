import { Injectable } from '@nestjs/common';
import { ProfessionalType } from '@prisma/client';

type BuildIntroMessageParams = {
  buyerName?: string | null;
  professionalName?: string | null;
  companyName?: string | null;
  professionalType?: ProfessionalType | string | null;
  leadSource?: string | null;
  leadInterest?: string | null;
  leadLocation?: string | null;
  leadBudget?: string | null;
};

@Injectable()
export class MessageTemplateService {
  buildProfessionalIntroMessage(params: BuildIntroMessageParams): string {
    const buyerName = params.buyerName || 'there';
    const professionalName = params.professionalName || 'your assigned professional';
    const companyName = params.companyName || 'our real estate partner network';
    const professionalTitle = this.formatProfessionalType(params.professionalType);
    const requestSentence = this.getRequestSentence(
      params.leadSource,
      params.leadInterest,
    );

    const details = this.buildLeadDetails({
      location: params.leadLocation,
      budget: params.leadBudget,
    });

    return [
      `Hello ${buyerName},`,
      ``,
      `My name is ${professionalName}, and I am your ${professionalTitle} at ${companyName}.`,
      ``,
      requestSentence,
      details,
      `I will review your information carefully and get back to you shortly with personalized guidance.`,
      ``,
      `Feel free to reply directly in this conversation if you have any questions.`,
      ``,
      `Best regards,`,
      `${professionalName}`,
      `${companyName}`,
    ]
      .filter((line) => line !== null && line !== undefined)
      .join('\n');
  }

  private formatProfessionalType(type?: ProfessionalType | string | null): string {
    if (!type) return 'real estate professional';

    const map: Record<string, string> = {
      PROPERTY_AGENT: 'property agent',
      MORTGAGE_BROKER: 'mortgage broker',
      PROPERTY_LAWYER: 'property lawyer',
      TAX_ADVISOR: 'tax advisor',
      HOME_INSPECTOR: 'home inspector',
      PROPERTY_VALUER: 'property valuer',
      INSURANCE_BROKER: 'insurance broker',
    };

    return map[String(type)] || 'real estate professional';
  }

  private getRequestSentence(
    source?: string | null,
    interest?: string | null,
  ): string {
    const value = `${source || ''} ${interest || ''}`.toLowerCase();

    if (value.includes('price checker')) {
      return `I received your price comparison request and will review whether the property price looks aligned with the market.`;
    }

    if (value.includes('property valuation')) {
      return `I received your property valuation request and will help you better understand the estimated market value.`;
    }

    if (value.includes('property search')) {
      return `I received your property search request and will help you evaluate suitable options based on your preferences.`;
    }

    if (value.includes('neighborhood finder')) {
      return `I received your neighborhood analysis request and will help you understand the best area for your buying goals.`;
    }

    if (value.includes('mortgage')) {
      return `I received your financing request and will help you review the next steps for your mortgage planning.`;
    }

    if (value.includes('true cost')) {
      return `I received your purchase cost analysis request and will help you understand the total costs involved.`;
    }

    return `I received your real estate request and will review it carefully.`;
  }

  private buildLeadDetails(params: {
    location?: string | null;
    budget?: string | null;
  }): string {
    const parts: string[] = [];

    if (params.location) {
      parts.push(`Location: ${params.location}`);
    }

    if (params.budget) {
      parts.push(`Budget / value: ${params.budget}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\nRequest details:\n${parts.map((item) => `- ${item}`).join('\n')}\n`;
  }
}