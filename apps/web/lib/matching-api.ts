import { apiFetch } from "./api";

export type MatchStatus =
  | "PENDING"
  | "ACTIVE"
  | "CONTACTED"
  | "COMPLETED"
  | "CANCELLED";

export type MatchItem = {
  id: string;
  buyerId: string | null;
  professionalId: string;
  leadId: string | null;
  score: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;

  buyer?: {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
  } | null;

  lead?: {
    id: string;
    userId?: string | null;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    interest: string | null;
    location: string | null;
    budget: string | null;
    quality: string;
    status: string;
  } | null;

  professional: {
    id: string;
    professionalType: string;
    companyName: string | null;
    rating: number;
    verificationStatus: string;

    user: {
      id: string;
      fullName: string | null;
      email: string;
      role?: string;
      avatarUrl?: string | null;
    };
  };

  review?: {
  id: string;
  rating: number;
  comment: string | null;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  matchId: string;
  createdAt: string;
  updatedAt?: string;
} | null;
};

/**
 * Admin seulement : affiche tous les matchs.
 */
export function getAdminMatches(token: string) {
  return apiFetch<MatchItem[]>("/matching", {
    token,
  });
}

/**
 * Buyer : affiche uniquement ses propres matchs.
 */
export function getMyBuyerMatches(token: string) {
  return apiFetch<MatchItem[]>("/matching/me/buyer", {
    token,
  });
}

/**
 * Professional : affiche uniquement les matchs qui lui sont affectés.
 */
export function getMyProfessionalMatches(token: string) {
  return apiFetch<MatchItem[]>("/matching/me/professional", {
    token,
  });
}

/**
 * Admin seulement.
 */
export function generateMatchesForLead(token: string, leadId: string) {
  return apiFetch<{
    message: string;
    count: number;
    professionalType: string;
    matches: MatchItem[];
  }>(`/matching/generate/${leadId}`, {
    method: "POST",
    token,
  });
}

/**
 * Admin seulement.
 */
export function approveMatch(token: string, id: string) {
  return apiFetch<MatchItem>(`/matching/${id}/approve`, {
    method: "PATCH",
    token,
  });
}

/**
 * Admin seulement.
 */
export function rejectMatch(token: string, id: string) {
  return apiFetch<MatchItem>(`/matching/${id}/reject`, {
    method: "PATCH",
    token,
  });
}

/**
 * Professional concerné seulement.
 */
export function markMatchContacted(token: string, id: string) {
  return apiFetch<MatchItem>(`/matching/${id}/contacted`, {
    method: "PATCH",
    token,
  });
}

/**
 * Admin ou Professional concerné selon tes permissions.
 */
export function markMatchCompleted(token: string, id: string) {
  return apiFetch<MatchItem>(`/matching/${id}/completed`, {
    method: "PATCH",
    token,
  });
}