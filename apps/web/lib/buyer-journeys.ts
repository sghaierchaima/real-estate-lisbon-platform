export type PurchaseGoal =
  | "PRIMARY_RESIDENCE"
  | "SECONDARY_RESIDENCE"
  | "INVESTMENT"
  | "RELOCATION"
  | "OTHER";

export type FinancingType =
  | "CASH"
  | "MORTGAGE"
  | "MIXED"
  | "UNDECIDED";

export type PurchaseTimeline =
  | "ASAP"
  | "ONE_TO_THREE_MONTHS"
  | "THREE_TO_SIX_MONTHS"
  | "SIX_TO_TWELVE_MONTHS"
  | "MORE_THAN_ONE_YEAR"
  | "UNDECIDED";

export type BuyerJourneyStatus =
  | "STARTED"
  | "FINANCING"
  | "PROFESSIONAL_MATCHING"
  | "PROPERTY_REVIEW"
  | "LEGAL_REVIEW"
  | "READY_TO_BUY"
  | "COMPLETED"
  | "CANCELLED";

export interface CreateBuyerJourneyPayload {
  propertyId: string;
  goal?: PurchaseGoal;
  estimatedBudget?: number;
  availableDeposit?: number;
  financingType?: FinancingType;
  timeline?: PurchaseTimeline;
  needsMortgageBroker?: boolean;
  needsPropertyLawyer?: boolean;
  needsTaxAdvisor?: boolean;
  needsInsuranceBroker?: boolean;
  notes?: string;
}

export interface BuyerJourneyProperty {
  id: string;
  title: string;
  price: number;
  city?: string | null;
  region?: string | null;
  location?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  imageUrls?: string[];
}

export interface BuyerJourney {
  id: string;
  buyerId: string;
  propertyId: string;

  goal?: PurchaseGoal | null;
  estimatedBudget?: number | null;
  availableDeposit?: number | null;

  financingType: FinancingType;
  timeline: PurchaseTimeline;

  needsMortgageBroker: boolean;
  needsPropertyLawyer: boolean;
  needsTaxAdvisor: boolean;
  needsInsuranceBroker: boolean;

  status: BuyerJourneyStatus;
  progress: number;

  notes?: string | null;

  createdAt: string;
  updatedAt: string;

  property?: BuyerJourneyProperty;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("accessToken");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Something went wrong. Please try again."
    );
  }

  return data as T;
}

export function createBuyerJourney(
  payload: CreateBuyerJourneyPayload
) {
  return request<BuyerJourney>("/buyer-journeys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyBuyerJourneys() {
  return request<BuyerJourney[]>("/buyer-journeys/me");
}

export function getBuyerJourney(id: string) {
  return request<BuyerJourney>(
    `/buyer-journeys/me/${id}`
  );
}

export function updateBuyerJourney(
  id: string,
  payload: Partial<CreateBuyerJourneyPayload> & {
    status?: BuyerJourneyStatus;
    progress?: number;
  }
) {
  return request<BuyerJourney>(
    `/buyer-journeys/me/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteBuyerJourney(id: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/buyer-journeys/me/${id}`, {
    method: "DELETE",
  });
}