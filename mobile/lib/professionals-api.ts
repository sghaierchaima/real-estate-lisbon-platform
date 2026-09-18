import {
  apiFetch,
} from "./api";

export type ProfessionalType =
  | "MORTGAGE_BROKER"
  | "PROPERTY_AGENT"
  | "PROPERTY_LAWYER"
  | "TAX_ADVISOR"
  | "HOME_INSPECTOR"
  | "PROPERTY_VALUER"
  | "INSURANCE_BROKER";

export type Professional = {
  id: string;

  userId: string;

  professionalType:
    ProfessionalType;

  companyName:
    string | null;

  bio:
    string | null;

  languages:
    string[];

  rating:
    number;

  reviewsCount:
    number;

  clientsCount:
    number;

  verificationStatus:
    string;

  isFeatured:
    boolean;

  profileCompletion:
    number;

  createdAt?:
    string;

  updatedAt?:
    string;

  user: {
    id: string;

    fullName:
      string | null;

    email:
      string;

    phone?:
      string | null;

    avatarUrl?:
      string | null;

    city?:
      string | null;

    country?:
      string | null;
  };
};

export function getPublicProfessionals(
  type?: ProfessionalType,
) {
  const query =
    type
      ? `?type=${encodeURIComponent(
          type,
        )}`
      : "";

  return apiFetch<
    Professional[]
  >(
    `/professionals/public${query}`,
  );
}

export function getPublicProfessional(
  id: string,
) {
  return apiFetch<
    Professional
  >(
    `/professionals/public/${encodeURIComponent(
      id,
    )}`,
  );
}