import { apiFetch } from "./api";

export type ProfessionalType =
  | "MORTGAGE_BROKER"
  | "PROPERTY_AGENT"
  | "PROPERTY_LAWYER"
  | "TAX_ADVISOR"
  | "HOME_INSPECTOR"
  | "PROPERTY_VALUER"
  | "INSURANCE_BROKER";

export type VerificationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED";

export type ProfessionalApplicationPayload = {
  professionalType: ProfessionalType;
  companyName?: string;
  bio?: string;
  languages: string[];
};

export type ProfessionalApplicationResponse = {
  message: string;
  professionalProfile: Professional;
};

export type Professional = {
  id: string;
  userId: string;
  professionalType: ProfessionalType;
  companyName: string | null;
  bio: string | null;
  languages: string[];
  rating: number;
  reviewsCount: number;
  clientsCount: number;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  profileCompletion: number;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: "ADMIN" | "BUYER" | "PROFESSIONAL";
    avatarUrl?: string | null;
    phone?: string | null;
    country?: string | null;
    city?: string | null;
  };
  properties?: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  region: string | null;
  city: string | null;
  price: number;
  propertyType: string | null;
  status: string;
  featured: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  imageUrls: string[];
  createdAt: string;
}[];
};

export function getProfessionals(token: string) {
  return apiFetch<Professional[]>("/professionals", { token });
}

export function getProfessionalById(
  token: string,
  id: string,
) {
  return apiFetch<Professional>(
    `/professionals/${id}`,
    {
      token,
    },
  );
}

export function approveProfessional(token: string, id: string) {
  return apiFetch<Professional>(`/professionals/${id}/approve`, {
    method: "PATCH",
    token,
  });
}

export function rejectProfessional(token: string, id: string) {
  return apiFetch<Professional>(`/professionals/${id}/reject`, {
    method: "PATCH",
    token,
  });
}

export function getPublicProfessionals(type?: string) {
  const query = type ? `?type=${type}` : "";
  return apiFetch<Professional[]>(`/professionals/public${query}`);
}

export function getPublicProfessional(id: string) {
  return apiFetch<Professional>(`/professionals/public/${id}`);
}

export function submitProfessionalApplication(
  token: string,
  payload: ProfessionalApplicationPayload,
) {
  return apiFetch<ProfessionalApplicationResponse>(
    "/professionals/apply",
    {
      method: "POST",
      token,
      body: payload,
    },
  );
}
export type MyProfessionalProfile = {
  id: string;
  userId: string;
  professionalType: ProfessionalType;
  companyName: string | null;
  bio: string | null;
  languages: string[];
  rating: number;
  reviewsCount: number;
  clientsCount: number;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
};

export type MyProfessionalApplicationResponse = {
  role: "ADMIN" | "BUYER" | "PROFESSIONAL";
  professionalProfile:
    | MyProfessionalProfile
    | null;
};

export function getMyProfessionalApplication(
  token: string,
) {
  return apiFetch<MyProfessionalApplicationResponse>(
    "/professionals/me/application",
    {
      token,
    },
  );
}