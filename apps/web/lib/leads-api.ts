import { apiFetch } from "./api";

import type { Property } from "@/lib/properties-api";

// ============================================================
// LEAD QUALITY
// ============================================================

export type LeadQuality =
  | "HOT"
  | "WARM"
  | "COLD";

// ============================================================
// LEAD STATUS
// ============================================================

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "MATCHED"
  | "CLOSED"
  | "LOST";

// ============================================================
// MATCH STATUS
// ============================================================

export type MatchStatus =
  | "PENDING"
  | "ACTIVE"
  | "CONTACTED"
  | "COMPLETED"
  | "CANCELLED";

// ============================================================
// AUTO MATCHING RESULT
// ============================================================

export type AutoMatchingResult =
  | {
      matched: true;
      professionalType: string;
      threshold: number;
      count: number;
      matches?: LeadMatch[];
    }
  | {
      matched: false;
      reason:
        | "LEAD_NOT_FOUND"
        | "LEAD_HAS_NO_BUYER"
        | "NO_ELIGIBLE_PROFESSIONAL"
        | "NO_CANDIDATE_ABOVE_THRESHOLD"
        | "MATCH_CREATION_FAILED"
        | string;

      professionalType?: string;
      threshold?: number;
      matches?: LeadMatch[];
    };

// ============================================================
// LEAD MATCH
// ============================================================

export type LeadMatch = {
  id: string;

  buyerId: string | null;
  professionalId: string;
  leadId: string | null;

  propertyId?: string | null;

  score: number;
  status: MatchStatus;

  createdAt: string;
  updatedAt: string;

  professional: {
    id: string;

    userId: string;

    professionalType: string;

    companyName: string | null;

    verificationStatus?: string;

    rating?: number;
    reviewsCount?: number;
    clientsCount?: number;

    user: {
      id: string;

      fullName: string | null;

      email: string;

      role?:
        | "ADMIN"
        | "BUYER"
        | "PROFESSIONAL";

      avatarUrl?: string | null;

      phone?: string | null;
      city?: string | null;
      country?: string | null;
    };
  };
};

// ============================================================
// LEAD
// ============================================================

export type Lead = {
  id: string;

  userId: string | null;

  fullName: string | null;

  email: string | null;

  phone: string | null;

  source: string | null;

  interest: string | null;

  location: string | null;

  budget: string | null;

  quality: LeadQuality;

  status: LeadStatus;

  // ==========================================================
  // PROPERTY SEARCH ASSISTANT
  // ==========================================================

  searchText?: string | null;

  propertyType?: string | null;

  bedrooms?: number | null;

  bathrooms?: number | null;

  minBudget?: number | null;

  maxBudget?: number | null;

  goal?: string | null;

  mustHave?: string[];

  aiSummary?: string | null;

  confidence?: number | null;

  // ==========================================================
  // PERSISTENT PROPERTY SEARCH
  // ==========================================================

  isActive?: boolean;

  notificationsEnabled?: boolean;

  lastMatchedAt?: string | null;

  // ==========================================================
  // RELATIONS
  // ==========================================================

  matches?: LeadMatch[];

  // ==========================================================
  // AUTO MATCHING
  // ==========================================================

  autoMatching?: AutoMatchingResult | null;

  // ==========================================================
  // RESPONSE METADATA
  // ==========================================================

  alreadyExists?: boolean;

  minArea?: number | null;
  maxArea?: number | null;

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  createdAt: string;

  updatedAt: string;
};

// ============================================================
// BUYER REQUEST RESPONSE
// ============================================================

export type BuyerRequestResponse =
  Lead & {
    alreadyExists?: boolean;

    autoMatching?: AutoMatchingResult | null;
  };

// ============================================================
// ADMIN - GET ALL LEADS
// ============================================================

export function getLeads(
  token: string,
) {
  return apiFetch<Lead[]>(
    "/leads",
    {
      token,
    },
  );
}

// ============================================================
// BUYER - GET MY LEADS
// ============================================================

export function getMyLeads(
  token: string,
) {
  return apiFetch<Lead[]>(
    "/leads/me",
    {
      token,
    },
  );
}

// ============================================================
// ADMIN - UPDATE LEAD
// ============================================================
//
// Important:
// MATCHED must never be set manually by Admin.
// Backend already protects this.
//
// This function remains available only for legitimate lifecycle
// changes such as CLOSED / LOST or other administrative data.
// ============================================================

export function updateLead(
  token: string,
  id: string,
  data: Partial<Lead>,
) {
  return apiFetch<Lead>(
    `/leads/${id}`,
    {
      method: "PATCH",

      token,

      body: data,
    },
  );
}

// ============================================================
// ADMIN - DELETE LEAD
// ============================================================

export function deleteLead(
  token: string,
  id: string,
) {
  return apiFetch<{
    message: string;
  }>(
    `/leads/${id}`,
    {
      method: "DELETE",

      token,
    },
  );
}

// ============================================================
// PROPERTY ALERTS ON / OFF
// ============================================================

export type UpdatePropertyAlertsResponse = {
  id: string;

  isActive: boolean;

  notificationsEnabled: boolean;
};

export function updatePropertyAlerts(
  token: string,
  leadId: string,
  enabled: boolean,
) {
  return apiFetch<UpdatePropertyAlertsResponse>(
    `/leads/${leadId}/property-alerts`,
    {
      method: "PATCH",

      token,

      body: {
        enabled,
      },
    },
  );
}

// ============================================================
// NEIGHBORHOOD FINDER
// ============================================================

export type NeighborhoodLeadPayload = {
  neighborhoodId: string;

  neighborhoodName: string;

  budgetMin?: string;

  budgetMax?: string;

  profile: string;

  goal: string;
};

export function createLeadFromNeighborhoodFinder(
  token: string,
  data: NeighborhoodLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-neighborhood-finder",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// PROPERTY VALUATION
// ============================================================

export type PropertyValuationLeadPayload = {
  address: string;

  propertyType: string;

  condition: string;

  size: string;

  askingPrice: string;

  bedrooms?: string;

  bathrooms?: string;

  floorLevel?: string;

  estimatedValue: string;

  valuationRange: string;

  verdict: string;
};

export function createLeadFromPropertyValuation(
  token: string,
  data: PropertyValuationLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-property-valuation",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// PROPERTY SEARCH ASSISTANT
// ============================================================

export type MatchedProperty =
  Property & {
    matchScore: number;

    matchedCriteria: string[];

    missingCriteria: string[];

    recommendation: string;
  };

export type PropertySearchRequestPayload = {
  searchText: string;

  location?: string;

  budget?: string;

  propertyType?: string;

  bedrooms?: number;

  bathrooms?: number;

  minBudget?: number;

  maxBudget?: number;

  goal?: string;

  mustHave?: string[];

  aiSummary?: string;

  confidence?: number;

  notificationsEnabled?: boolean;

  minArea?: number;
  maxArea?: number;
};

// ============================================================
// PROPERTY SEARCH RESPONSE
// ============================================================

export type PropertySearchFoundResponse = {
  found: true;

  properties: MatchedProperty[];

  alreadyExists: false;
};

export type PropertySearchLeadResponse = {
  found: false;

  lead: BuyerRequestResponse;

  notifiedAgents: number;

  alreadyExists: boolean;
};

export type PropertySearchResponse =
  | PropertySearchFoundResponse
  | PropertySearchLeadResponse;

export function createLeadFromPropertySearch(
  token: string,
  data: PropertySearchRequestPayload,
) {
  return apiFetch<PropertySearchResponse>(
    "/leads/from-property-search",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// PRICE CHECKER
// ============================================================

export type PriceCheckerLeadPayload = {
  location: string;

  askingPrice: string;

  marketPrice: string;

  size: string;

  verdict: string;

  variancePct: string;
};

export function createLeadFromPriceChecker(
  token: string,
  data: PriceCheckerLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-price-checker",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// AFFORDABILITY CALCULATOR
// ============================================================

export type AffordabilityLeadPayload = {
  annualIncome: string;

  monthlyDebts: string;

  downPayment: string;

  interestRate: string;

  recommendedBudget: string;

  maximumBudget: string;

  debtToIncome: string;

  riskLabel: string;
};

export function createLeadFromAffordabilityCalculator(
  token: string,
  data: AffordabilityLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-affordability-calculator",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// TRUE COST CALCULATOR
// ============================================================

export type TrueCostLeadPayload = {
  propertyPrice: string;

  imtTax: string;

  stampDuty: string;

  notaryFees: string;

  legalFees: string;

  bankFees: string;

  totalExtraCosts: string;

  totalCost: string;
};

export function createLeadFromTrueCostCalculator(
  token: string,
  data: TrueCostLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-true-cost-calculator",
    {
      method: "POST",

      token,

      body: data,
    },
  );
}

// ============================================================
// MORTGAGE CALCULATOR
// ============================================================

export type MortgageLeadPayload = {
  fullName?: string;

  email: string;

  phone?: string;

  propertyPrice: string;

  downPayment: string;

  interestRate: string;

  loanTermYears: string;

  loanAmount: string;

  monthlyPayment: string;

  totalInterest: string;

  totalCost: string;
};

// ============================================================
// MORTGAGE CALCULATOR LEAD
// ============================================================

export type MortgageCalculatorLeadPayload = {
  fullName?: string;

  email: string;

  phone?: string;

  source: string;

  interest?: string;

  location?: string;

  budget?: string;
};

export function createLeadFromMortgageCalculator(
  token: string,
  payload: MortgageCalculatorLeadPayload,
) {
  return apiFetch<BuyerRequestResponse>(
    "/leads/from-calculator",
    {
      method: "POST",

      token,

      body: payload,
    },
  );
}


