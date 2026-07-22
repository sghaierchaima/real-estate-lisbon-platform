import { apiFetch } from "./api";

export type PropertyStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type PropertyProfessionalProfile = {
  id: string;
  userId: string;
  companyName: string | null;
  professionalType: string;
  verificationStatus: string;

  user: {
    id: string;
    fullName: string | null;
    email: string;
    role?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    city?: string | null;
    country?: string | null;
  };
};

export type Property = {
  id: string;
  professionalProfileId: string;

  title: string;
  description: string | null;

  location: string | null;
  region: string | null;
  city: string | null;

  price: number;
  propertyType: string | null;
  status: PropertyStatus;
  featured: boolean;

  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  landArea: number | null;
  constructionYear: number | null;

  equipments: string[];
  imageUrls: string[];

  createdAt: string;
  updatedAt: string;

  professionalProfile?: PropertyProfessionalProfile;
};

export type PropertyPayload = {
  title: string;
  description?: string;
  location?: string;
  region?: string;
  city?: string;
  price: number;
  propertyType?: string;
  status?: PropertyStatus;
  featured?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  landArea?: number;
  constructionYear?: number;
  equipments?: string[];
  imageUrls?: string[];
};

export function getProperties(token: string) {
  return apiFetch<Property[]>("/properties", { token });
}

export function getProperty(token: string, id: string) {
  return apiFetch<Property>(`/properties/${id}`, { token });
}

export function createProperty(token: string, data: PropertyPayload) {
  return apiFetch<Property>("/properties", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateProperty(
  token: string,
  id: string,
  data: Partial<PropertyPayload>
) {
  return apiFetch<Property>(`/properties/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function deleteProperty(token: string, id: string) {
  return apiFetch<{ message: string }>(`/properties/${id}`, {
    method: "DELETE",
    token,
  });
}
export async function createPropertyWithImages(
  token: string,
  formData: FormData
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create property");
  }

  return res.json();
}
export async function updatePropertyWithImages(
  token: string,
  id: string,
  formData: FormData
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/properties/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update property");
  }

  return res.json();
}
export function getPublicProperties() {
  return apiFetch<Property[]>("/properties/public");
}
export function getPublicProperty(
  id: string,
) {
  return apiFetch<Property>(
    `/properties/public/${id}`,
  );
}