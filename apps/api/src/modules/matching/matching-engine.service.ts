import {
  Injectable,
} from '@nestjs/common';

import {
  Lead,
  ProfessionalProfile,
  ProfessionalType,
  VerificationStatus,
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

export type DetailedMatchingScore = {
  score: number;
  reasons: string[];
};

@Injectable()
export class MatchingEngineService {
  /*
   * ============================================================
   * PROFESSIONAL TYPE DETECTION
   * ============================================================
   *
   * A Buyer Request is automatically routed to the most
   * appropriate professional category.
   *
   * No Admin intervention.
   * ============================================================
   */

  detectProfessionalType(
    text: string,
  ): ProfessionalType {
    const value =
      this.normalize(text);

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
      ) ||
      value.includes(
        'estimated value',
      )
    ) {
      return ProfessionalType
        .PROPERTY_VALUER;
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
      ) ||
      value.includes(
        'credit',
      ) ||
      value.includes(
        'bank',
      )
    ) {
      return ProfessionalType
        .MORTGAGE_BROKER;
    }

    /*
     * LEGAL
     *
     * Checked before generic tax/cost expressions
     * when explicit legal assistance is requested.
     */
    if (
      value.includes(
        'legal support',
      ) ||
      value.includes(
        'lawyer',
      ) ||
      value.includes(
        'legal',
      ) ||
      value.includes(
        'contract',
      ) ||
      value.includes(
        'cpcv',
      ) ||
      value.includes(
        'solicitor',
      ) ||
      value.includes(
        'notary',
      )
    ) {
      return ProfessionalType
        .PROPERTY_LAWYER;
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
        'purchase costs',
      ) ||
      value.includes(
        'tax advisor',
      ) ||
      value.includes(
        'tax',
      ) ||
      value.includes(
        'taxes',
      ) ||
      value.includes(
        'fiscal',
      ) ||
      value.includes(
        'imt',
      ) ||
      value.includes(
        'stamp duty',
      ) ||
      value.includes(
        'irs',
      )
    ) {
      return ProfessionalType
        .TAX_ADVISOR;
    }

    /*
     * HOME INSPECTION
     */
    if (
      value.includes(
        'inspection',
      ) ||
      value.includes(
        'inspector',
      ) ||
      value.includes(
        'survey',
      ) ||
      value.includes(
        'property condition',
      )
    ) {
      return ProfessionalType
        .HOME_INSPECTOR;
    }

    /*
     * INSURANCE
     */
    if (
      value.includes(
        'insurance',
      ) ||
      value.includes(
        'insured',
      ) ||
      value.includes(
        'coverage',
      )
    ) {
      return ProfessionalType
        .INSURANCE_BROKER;
    }

    /*
     * PROPERTY SEARCH / NEIGHBORHOOD
     */
    if (
      value.includes(
        'property search',
      ) ||
      value.includes(
        'property search assistant',
      ) ||
      value.includes(
        'neighborhood finder',
      ) ||
      value.includes(
        'neighborhood',
      ) ||
      value.includes(
        'district',
      ) ||
      value.includes(
        'community',
      ) ||
      value.includes(
        'relocation',
      ) ||
      value.includes(
        'buy to live',
      ) ||
      value.includes(
        'property purchase',
      )
    ) {
      return ProfessionalType
        .PROPERTY_AGENT;
    }

    /*
     * Default real-estate journey professional.
     */
    return ProfessionalType
      .PROPERTY_AGENT;
  }

  /*
   * ============================================================
   * SMART MATCHING SCORE
   * ============================================================
   *
   * Maximum = 100
   *
   * Specialization             50
   * Verified / ACTIVE          10
   * Location                   15
   * Rating                     10
   * Profile completion          7
   * Experience                  5
   * Featured                    3
   *
   * TOTAL                     100
   *
   * AutoMatching threshold = 70
   * ============================================================
   */

  calculateDetailedScore(
    lead: Lead,
    professional:
      ProfessionalForMatching,
  ): DetailedMatchingScore {
    let score = 0;

    const reasons:
      string[] = [];

    const expectedType =
      this.detectProfessionalType(
        `${lead.source || ''} ${
          lead.interest || ''
        }`,
      );

    /*
     * ========================================================
     * 1. SPECIALIZATION — 50
     * ========================================================
     *
     * This is the strongest business criterion.
     */
    if (
      professional
        .professionalType ===
      expectedType
    ) {
      score += 50;

      reasons.push(
        'Professional specialization matches the buyer request',
      );
    } else {
      /*
       * Normally AutoMatchingService already filters
       * professionals by the expected type.
       *
       * Keeping this defensive check makes the engine safe
       * if it is reused elsewhere.
       */
      return {
        score: 0,

        reasons: [
          'Professional specialization does not match the buyer request',
        ],
      };
    }

    /*
     * ========================================================
     * 2. VERIFIED PROFESSIONAL — 10
     * ========================================================
     *
     * AutoMatchingService only selects ACTIVE professionals.
     * We still reflect verification in the score because it is
     * a meaningful trust criterion.
     */
    if (
      professional
        .verificationStatus ===
      VerificationStatus.ACTIVE
    ) {
      score += 10;

      reasons.push(
        'Professional is verified and active',
      );
    }

    /*
     * ========================================================
     * 3. LOCATION — 15
     * ========================================================
     */

    if (
      lead.location?.trim()
    ) {
      const wantedLocation =
        this.normalize(
          lead.location,
        );

      const city =
        this.normalize(
          professional.user.city ||
            '',
        );

      const country =
        this.normalize(
          professional.user.country ||
            '',
        );

      const bio =
        this.normalize(
          professional.bio ||
            '',
        );

      const company =
        this.normalize(
          professional.companyName ||
            '',
        );

      const professionalLocation =
        [
          city,
          country,
          bio,
          company,
        ]
          .filter(Boolean)
          .join(' ');

      /*
       * Exact / broad compatibility.
       *
       * Examples:
       *
       * Portugal ↔ Lisbon, Portugal
       * Lisboa ↔ Lisboa
       * Cascais ↔ Cascais, Portugal
       */
      const locationMatches =
        professionalLocation.includes(
          wantedLocation,
        ) ||
        (
          city &&
          wantedLocation.includes(
            city,
          )
        ) ||
        (
          country &&
          wantedLocation.includes(
            country,
          )
        );

      if (locationMatches) {
        score += 15;

        reasons.push(
          'Professional location is relevant to the buyer request',
        );
      } else if (
        wantedLocation ===
          'portugal' &&
        country ===
          'portugal'
      ) {
        score += 15;

        reasons.push(
          'Professional operates in Portugal',
        );
      }
    } else {
      /*
       * No explicit geographical restriction.
       *
       * Do not penalize the professional.
       */
      score += 15;

      reasons.push(
        'No restrictive buyer location criterion',
      );
    }

    /*
     * ========================================================
     * 4. RATING — 10
     * ========================================================
     */

    if (
      professional.rating >=
      4.8
    ) {
      score += 10;

      reasons.push(
        'Excellent professional rating',
      );
    } else if (
      professional.rating >=
      4.5
    ) {
      score += 8;

      reasons.push(
        'Very strong professional rating',
      );
    } else if (
      professional.rating >=
      4
    ) {
      score += 6;

      reasons.push(
        'Good professional rating',
      );
    } else if (
      professional.rating >=
      3.5
    ) {
      score += 4;
    } else if (
      professional.rating >
      0
    ) {
      score += 2;
    }

    /*
     * ========================================================
     * 5. PROFILE COMPLETION — 7
     * ========================================================
     */

    if (
      professional
        .profileCompletion >=
      90
    ) {
      score += 7;

      reasons.push(
        'Highly complete professional profile',
      );
    } else if (
      professional
        .profileCompletion >=
      70
    ) {
      score += 5;

      reasons.push(
        'Professional profile is well completed',
      );
    } else if (
      professional
        .profileCompletion >=
      50
    ) {
      score += 3;
    } else if (
      professional
        .profileCompletion >
      0
    ) {
      score += 1;
    }

    /*
     * ========================================================
     * 6. EXPERIENCE / CLIENTS — 5
     * ========================================================
     */

    if (
      professional
        .clientsCount >=
      100
    ) {
      score += 5;

      reasons.push(
        'Extensive client experience',
      );
    } else if (
      professional
        .clientsCount >=
      50
    ) {
      score += 4;

      reasons.push(
        'Strong client experience',
      );
    } else if (
      professional
        .clientsCount >=
      20
    ) {
      score += 3;
    } else if (
      professional
        .clientsCount >
      0
    ) {
      score += 1;
    }

    /*
     * ========================================================
     * 7. FEATURED — 3
     * ========================================================
     */

    if (
      professional.isFeatured
    ) {
      score += 3;

      reasons.push(
        'Featured professional',
      );
    }

    /*
     * ========================================================
     * FINAL RESULT
     * ========================================================
     */

    return {
      score:
        Math.min(
          Math.round(
            score,
          ),
          100,
        ),

      reasons,
    };
  }

  /*
   * ============================================================
   * NORMALIZATION
   * ============================================================
   */

  private normalize(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .normalize(
        'NFD',
      )
      .replace(
        /[\u0300-\u036f]/g,
        '',
      );
  }
}