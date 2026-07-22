import { Injectable } from '@nestjs/common';
import { LeadQuality } from '@prisma/client';

@Injectable()
export class LeadScoringService {
  calculateQuality(data: {
    phone?: string | null;
    budget?: string | null;
    location?: string | null;
    interest?: string | null;
  }): LeadQuality {
    let score = 0;

    if (data.phone) score += 25;
    if (data.location) score += 20;
    if (data.interest) score += 20;

    if (data.budget) {
      const budgetNumber = Number(data.budget.replace(/[^\d]/g, ''));

      if (budgetNumber >= 500000) score += 35;
      else if (budgetNumber >= 250000) score += 25;
      else score += 10;
    }

    if (score >= 70) return LeadQuality.HOT;
    if (score >= 40) return LeadQuality.WARM;

    return LeadQuality.COLD;
  }
}