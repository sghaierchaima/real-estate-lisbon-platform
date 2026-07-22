import { apiFetch } from "./api";

export type BuyerProfileSummary = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  profileCompletion: number;
  profileTier:
    | "REGISTERED"
    | "EXPLORER"
    | "ACTIVE_BUYER"
    | "QUALIFIED"
    | "PRIORITY";
  usedTools: string[];
  totalRequests: number;
  totalMatches: number;
  nextSteps: string[];
  journey: {
  accountCreated: boolean;
  profileCompleted: boolean;
  firstToolCompleted: boolean;
  matchedWithProfessional: boolean;
  contactedProfessional: boolean;
  completedJourney: boolean;
};
};

export function getMyProfile(token: string) {
  return apiFetch<BuyerProfileSummary>("/users/me/profile", {
    token,
  });
}