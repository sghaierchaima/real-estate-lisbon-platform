import { apiFetch } from "./api";

export type ReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;

  buyerId: string;
  professionalId: string;
  matchId: string;

  createdAt: string;
  updatedAt: string;
};

export type CreateReviewResponse = {
  message: string;
  review: Review;
};

export type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;

  buyerId: string;
  professionalId: string;
  matchId: string;

  createdAt: string;
  updatedAt: string;

  buyer: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };

  professional: {
    id: string;
    professionalType: string;
    companyName: string | null;

    user: {
      id: string;
      fullName: string | null;
      email: string;
      avatarUrl: string | null;
    };
  };

  match: {
    id: string;
    status: string;
    score: number;
    createdAt: string;
  };
};

/*
 * ============================================================
 * BUYER API
 * ============================================================
 */

export function createReview(
  token: string,
  data: {
    matchId: string;
    rating: number;
    comment?: string;
  },
) {
  return apiFetch<CreateReviewResponse>(
    "/reviews",
    {
      method: "POST",
      token,

      /*
       * Ton apiFetch applique déjà JSON.stringify.
       * Il faut donc transmettre directement l’objet.
       */
      body: data,
    },
  );
}

export function getMyMatchReview(
  token: string,
  matchId: string,
) {
  return apiFetch<Review | null>(
    `/reviews/match/${matchId}/me`,
    {
      token,
    },
  );
}

/*
 * ============================================================
 * ADMIN API
 * ============================================================
 */

export function getAdminReviews(
  token: string,
  status?: ReviewStatus,
) {
  const query = status
    ? `?status=${status}`
    : "";

  return apiFetch<AdminReview[]>(
    `/reviews${query}`,
    {
      token,
    },
  );
}

export function approveReview(
  token: string,
  reviewId: string,
) {
  return apiFetch<{
    message: string;
    review: AdminReview;
  }>(
    `/reviews/${reviewId}/approve`,
    {
      method: "PATCH",
      token,
    },
  );
}

export function rejectReview(
  token: string,
  reviewId: string,
) {
  return apiFetch<{
    message: string;
    review: AdminReview;
  }>(
    `/reviews/${reviewId}/reject`,
    {
      method: "PATCH",
      token,
    },
  );
}

/*
 * ============================================================
 * PUBLIC API
 * ============================================================
 */

export function getProfessionalReviews(
  professionalId: string,
) {
  return apiFetch<AdminReview[]>(
    `/reviews/professional/${professionalId}`,
    {},
  );
}