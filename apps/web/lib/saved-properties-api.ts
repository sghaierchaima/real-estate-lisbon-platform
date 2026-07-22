import { apiFetch } from "./api";
import type { Property } from "./properties-api";

export type SavedPropertyItem = {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property: Property;
};

export function getSavedProperties(
  token: string,
) {
  return apiFetch<SavedPropertyItem[]>(
    "/saved-properties",
    {
      token,
    },
  );
}

export function getSavedPropertyIds(
  token: string,
) {
  return apiFetch<{
    propertyIds: string[];
  }>("/saved-properties/ids", {
    token,
  });
}

export function getSavedPropertyStatus(
  token: string,
  propertyId: string,
) {
  return apiFetch<{
    isSaved: boolean;
  }>(
    `/saved-properties/${propertyId}/status`,
    {
      token,
    },
  );
}

export function saveProperty(
  token: string,
  propertyId: string,
) {
  return apiFetch<{
    message: string;
  }>(
    `/saved-properties/${propertyId}`,
    {
      method: "POST",
      token,
    },
  );
}

export function removeSavedProperty(
  token: string,
  propertyId: string,
) {
  return apiFetch<{
    message: string;
  }>(
    `/saved-properties/${propertyId}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export function toggleSavedProperty(
  token: string,
  propertyId: string,
) {
  return apiFetch<{
    isSaved: boolean;
    message: string;
  }>(
    `/saved-properties/${propertyId}/toggle`,
    {
      method: "PATCH",
      token,
    },
  );
}
export function getSavedPropertiesCount(
  token: string,
) {
  return apiFetch<{
    count: number;
  }>("/saved-properties/count", {
    token,
  });
}