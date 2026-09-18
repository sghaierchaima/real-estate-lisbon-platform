import { apiFetch } from "./api";

/* ============================================================
   TYPES
============================================================ */

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

export type PublicProfessionalReview = Review & {
  buyer?: {
    id: string;

    fullName: string | null;

    email?: string;

    avatarUrl?: string | null;
  } | null;
};

export type CreateReviewResponse = {
  message: string;

  review: Review;
};

/* ============================================================
   BUYER
============================================================ */

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

      body: data,
    },
  );
}

export function getMyMatchReview(
  token: string,
  matchId: string,
) {
  return apiFetch<Review | null>(
    `/reviews/match/${encodeURIComponent(matchId)}/me`,
    {
      token,
    },
  );
}

/* ============================================================
   PUBLIC
============================================================ */

export function getProfessionalReviews(
  professionalId: string,
) {
  return apiFetch<PublicProfessionalReview[]>(
    `/reviews/professional/${encodeURIComponent(
      professionalId,
    )}`,
  );
}
