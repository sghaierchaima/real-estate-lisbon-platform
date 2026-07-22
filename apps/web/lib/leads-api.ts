import { apiFetch } from "./api";

export type LeadQuality = "HOT" | "WARM" | "COLD";

export type LeadStatus = "NEW" | "CONTACTED" | "MATCHED" | "CLOSED" | "LOST";

export type MatchStatus =
  | "PENDING"
  | "ACTIVE"
  | "CONTACTED"
  | "COMPLETED"
  | "CANCELLED";

export type LeadMatch = {
  id: string;
  buyerId: string | null;
  professionalId: string;
  leadId: string | null;
  score: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  professional: {
    id: string;
    userId: string;
    professionalType: string;
    companyName: string | null;
    user: {
      id: string;
      fullName: string | null;
      email: string;
      role: "ADMIN" | "BUYER" | "PROFESSIONAL";
    };
  };
};

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
  createdAt: string;
  updatedAt: string;
  matches: LeadMatch[];
};

export function getLeads(token: string) {
  return apiFetch<Lead[]>("/leads", { token });
}

export async function updateLead(
  token: string,
  id: string,
  data: Partial<Lead>
) {
  return apiFetch<Lead>(`/leads/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteLead(token: string, id: string) {
  return apiFetch<{ message: string }>(`/leads/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function generateMatch(token: string, leadId: string) {
  return apiFetch(`/matching/generate/${leadId}`, {
    method: "POST",
    token,
  });
}
export async function createLeadFromNeighborhoodFinder(
  token: string,
  data: {
    neighborhoodId: string;
    neighborhoodName: string;
    budgetMin?: string;
    budgetMax?: string;
    profile: string;
    goal: string;
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-neighborhood-finder",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}

export async function createLeadFromPropertyValuation(
  token: string,
  data: {
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
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-property-valuation",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}
export async function createLeadFromPropertySearch(
  token: string,
  data: {
    searchText: string;
    location?: string;
    budget?: string;
    propertyType?: string;
    bedrooms?: string;
    goal?: string;
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-property-search",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}
export async function createLeadFromPriceChecker(
  token: string,
  data: {
    location: string;
    askingPrice: string;
    marketPrice: string;
    size: string;
    verdict: string;
    variancePct: string;
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-price-checker",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}


export async function createLeadFromAffordabilityCalculator(
  token: string,
  data: {
    annualIncome: string;
    monthlyDebts: string;
    downPayment: string;
    interestRate: string;
    recommendedBudget: string;
    maximumBudget: string;
    debtToIncome: string;
    riskLabel: string;
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-affordability-calculator",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}
export async function createLeadFromTrueCostCalculator(
  token: string,
  data: {
    propertyPrice: string;
    imtTax: string;
    stampDuty: string;
    notaryFees: string;
    legalFees: string;
    bankFees: string;
    totalExtraCosts: string;
    totalCost: string;
  }
) {
  return apiFetch<Lead & { alreadyExists?: boolean }>(
    "/leads/from-true-cost-calculator",
    {
      method: "POST",
      token,
      body: data,
    }
  );
}

export function getMyLeads(token: string) {
  return apiFetch<Lead[]>('/leads/me', {
    token,
  });
}