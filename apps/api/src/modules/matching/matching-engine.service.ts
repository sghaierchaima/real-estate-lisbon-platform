import {
  Injectable,
} from '@nestjs/common';

import {
  Lead,
  ProfessionalProfile,
  ProfessionalType,
} from '@prisma/client';

type ProfessionalForMatching =
  ProfessionalProfile & {
    user: {
      id: string;
      fullName: string | null;
      email: string;
      city: string | null;
      country: string | null;
      avatarUrl: string | null;
    };
  };

@Injectable()
export class MatchingEngineService {
  detectProfessionalType(
    text: string,
  ): ProfessionalType {
    const value =
      text.toLowerCase();

    /*
     * PROPERTY VALUATION
     */
    if (
      value.includes(
        'property valuation',
      ) ||
      value.includes(
        'valuation',
      ) ||
      value.includes(
        'appraisal',
      ) ||
      value.includes(
        'price checker',
      ) ||
      value.includes(
        'estimate',
      )
    ) {
      return ProfessionalType.PROPERTY_VALUER;
    }

    /*
     * MORTGAGE / AFFORDABILITY
     */
    if (
      value.includes(
        'mortgage',
      ) ||
      value.includes(
        'affordability',
      ) ||
      value.includes(
        'loan',
      ) ||
      value.includes(
        'financing',
      ) ||
      value.includes(
        'finance',
      )
    ) {
      return ProfessionalType.MORTGAGE_BROKER;
    }

    /*
     * TAX / TRUE COST
     */
    if (
      value.includes(
        'true cost',
      ) ||
      value.includes(
        'buying costs',
      ) ||
      value.includes(
        'tax',
      ) ||
      value.includes(
        'imt',
      ) ||
      value.includes(
        'stamp duty',
      )
    ) {
      return ProfessionalType.TAX_ADVISOR;
    }

    /*
     * LAW
     */
    if (
      value.includes(
        'legal',
      ) ||
      value.includes(
        'lawyer',
      ) ||
      value.includes(
        'contract',
      )
    ) {
      return ProfessionalType.PROPERTY_LAWYER;
    }

    /*
     * INSPECTION
     */
    if (
      value.includes(
        'inspection',
      ) ||
      value.includes(
        'survey',
      )
    ) {
      return ProfessionalType.HOME_INSPECTOR;
    }

    /*
     * INSURANCE
     */
    if (
      value.includes(
        'insurance',
      ) ||
      value.includes(
        'coverage',
      )
    ) {
      return ProfessionalType.INSURANCE_BROKER;
    }

    /*
     * Property Search / Neighborhood etc.
     */
    return ProfessionalType.PROPERTY_AGENT;
  }

  calculateDetailedScore(
    lead: Lead,
    professional:
      ProfessionalForMatching,
  ) {
    let score = 0;

    const reasons: string[] =
      [];

    const expectedType =
      this.detectProfessionalType(
        `${lead.source || ''} ${lead.interest || ''}`,
      );

    /*
     * ========================================================
     * TYPE — 45
     * ========================================================
     */
    if (
      professional.professionalType ===
      expectedType
    ) {
      score += 45;

      reasons.push(
        'Professional specialization matches the buyer request',
      );
    }

    /*
     * ========================================================
     * LOCATION — 15
     * ========================================================
     */
    if (lead.location) {
      const wantedLocation =
        this.normalize(
          lead.location,
        );

      const professionalLocation =
        this.normalize(
          [
            professional.user.city,
            professional.user.country,
            professional.bio,
            professional.companyName,
          ]
            .filter(Boolean)
            .join(' '),
        );

      if (
        professionalLocation.includes(
          wantedLocation,
        ) ||
        wantedLocation.includes(
          this.normalize(
            professional.user.city ||
              '',
          ),
        )
      ) {
        score += 15;

        reasons.push(
          'Professional location is relevant to the request',
        );
      }
    } else {
      /*
       * No location criterion:
       * don't punish candidate.
       */
      score += 15;
    }

    /*
     * ========================================================
     * RATING — 15
     * ========================================================
     */
    if (
      professional.rating >=
      4.8
    ) {
      score += 15;

      reasons.push(
        'Excellent professional rating',
      );
    } else if (
      professional.rating >=
      4.5
    ) {
      score += 12;

      reasons.push(
        'Very strong professional rating',
      );
    } else if (
      professional.rating >=
      4
    ) {
      score += 9;

      reasons.push(
        'Good professional rating',
      );
    } else if (
      professional.rating > 0
    ) {
      score += 5;
    }

    /*
     * ========================================================
     * PROFILE COMPLETION — 10
     * ========================================================
     */
    if (
      professional.profileCompletion >=
      90
    ) {
      score += 10;

      reasons.push(
        'Highly complete professional profile',
      );
    } else if (
      professional.profileCompletion >=
      70
    ) {
      score += 7;
    } else if (
      professional.profileCompletion >=
      50
    ) {
      score += 4;
    }

    /*
     * ========================================================
     * EXPERIENCE / CLIENTS — 10
     * ========================================================
     */
    if (
      professional.clientsCount >=
      100
    ) {
      score += 10;

      reasons.push(
        'Strong client experience',
      );
    } else if (
      professional.clientsCount >=
      50
    ) {
      score += 8;
    } else if (
      professional.clientsCount >=
      20
    ) {
      score += 6;
    } else if (
      professional.clientsCount >
      0
    ) {
      score += 3;
    }

    /*
     * ========================================================
     * FEATURED — 5
     * ========================================================
     */
    if (
      professional.isFeatured
    ) {
      score += 5;

      reasons.push(
        'Featured professional',
      );
    }

    return {
      score:
        Math.min(
          Math.round(score),
          100,
        ),

      reasons,
    };
  }

  /*
   * Compatibility with your existing MatchingService.
   */
  calculateScore(
    lead: Lead,
    professional:
      ProfessionalProfile,
  ): number {
    /*
     * Old/manual workflow fallback.
     * AutoMatchingService uses calculateDetailedScore().
     */

    let score = 0;

    const expectedType =
      this.detectProfessionalType(
        `${lead.source || ''} ${lead.interest || ''}`,
      );

    if (
      professional.professionalType ===
      expectedType
    ) {
      score += 60;
    }

    if (
      professional.rating >=
      4.5
    ) {
      score += 15;
    } else if (
      professional.rating >= 4
    ) {
      score += 10;
    }

    if (
      professional.profileCompletion >=
      90
    ) {
      score += 15;
    } else if (
      professional.profileCompletion >=
      70
    ) {
      score += 10;
    }

    if (
      professional.clientsCount >=
      50
    ) {
      score += 10;
    } else if (
      professional.clientsCount >=
      20
    ) {
      score += 5;
    }

    return Math.min(
      score,
      100,
    );
  }

  private normalize(
    value: string,
  ) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      );
  }
}