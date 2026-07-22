import { Injectable } from '@nestjs/common';
import {
  Lead,
  LeadQuality,
  ProfessionalProfile,
  ProfessionalType,
  VerificationStatus,
} from '@prisma/client';

@Injectable()
export class MatchingEngineService {
  calculateScore(lead: Lead, professional: ProfessionalProfile): number {
    let score = 50;

    const leadText = `${lead.source || ''} ${lead.interest || ''} ${
      lead.location || ''
    } ${lead.budget || ''}`.toLowerCase();

    const professionalText = `${professional.bio || ''} ${
      professional.companyName || ''
    } ${professional.professionalType}`.toLowerCase();

    if (professional.verificationStatus === VerificationStatus.ACTIVE) {
      score += 15;
    }

    if (lead.quality === LeadQuality.HOT) score += 15;
    if (lead.quality === LeadQuality.WARM) score += 10;

    if (
      lead.location &&
      professionalText.includes(lead.location.toLowerCase())
    ) {
      score += 10;
    }

    if (
      lead.interest &&
      professionalText.includes(lead.interest.toLowerCase())
    ) {
      score += 10;
    }

    if (this.isCorrectProfessionalType(leadText, professional.professionalType)) {
      score += 20;
    }

    if (professional.rating >= 4.8) score += 10;
    else if (professional.rating >= 4.5) score += 7;
    else if (professional.rating >= 4) score += 4;

    if (professional.clientsCount >= 100) score += 10;
    else if (professional.clientsCount >= 50) score += 7;
    else if (professional.clientsCount >= 20) score += 4;

    if (professional.profileCompletion >= 90) score += 8;
    else if (professional.profileCompletion >= 70) score += 5;

    if (professional.isFeatured) score += 5;

    return Math.min(score, 98);
  }

  private isCorrectProfessionalType(
    leadText: string,
    type: ProfessionalType,
  ): boolean {
    if (
      leadText.includes('mortgage') ||
      leadText.includes('affordability') ||
      leadText.includes('loan') ||
      leadText.includes('financing')
    ) {
      return type === ProfessionalType.MORTGAGE_BROKER;
    }

    if (
      leadText.includes('true cost') ||
      leadText.includes('buying costs') ||
      leadText.includes('tax') ||
      leadText.includes('imt') ||
      leadText.includes('stamp duty')
    ) {
      return type === ProfessionalType.TAX_ADVISOR;
    }

    if (
      leadText.includes('legal') ||
      leadText.includes('lawyer') ||
      leadText.includes('contract')
    ) {
      return type === ProfessionalType.PROPERTY_LAWYER;
    }

    if (
      leadText.includes('valuation') ||
      leadText.includes('estimate') ||
      leadText.includes('appraisal') ||
      leadText.includes('price checker')
    ) {
      return type === ProfessionalType.PROPERTY_VALUER;
    }

    if (
      leadText.includes('inspection') ||
      leadText.includes('condition') ||
      leadText.includes('survey')
    ) {
      return type === ProfessionalType.HOME_INSPECTOR;
    }

    if (
      leadText.includes('insurance') ||
      leadText.includes('coverage')
    ) {
      return type === ProfessionalType.INSURANCE_BROKER;
    }

    return type === ProfessionalType.PROPERTY_AGENT;
  }
}