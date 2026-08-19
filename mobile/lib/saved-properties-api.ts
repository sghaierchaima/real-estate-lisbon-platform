import { apiFetch } from "./api";

export type SavedPropertyStatusResponse = {
  isSaved: boolean;
};

export type ToggleSavedPropertyResponse = {
  isSaved: boolean;
  message: string;
};

export type SavedPropertyIdsResponse = {
  propertyIds: string[];
};

export type SavedPropertiesCountResponse = {
  count: number;
};

export function getSavedPropertyStatus(
  token: string,
  propertyId: string,
) {
  return apiFetch<SavedPropertyStatusResponse>(
    `/saved-properties/${propertyId}/status`,
    {
      token,
    },
  );
}

export function toggleSavedProperty(
  token: string,
  propertyId: string,
) {
  return apiFetch<ToggleSavedPropertyResponse>(
    `/saved-properties/${propertyId}/toggle`,
    {
      method: "PATCH",
      token,
    },
  );
}

export function getSavedPropertyIds(
  token: string,
) {
  return apiFetch<SavedPropertyIdsResponse>(
    "/saved-properties/ids",
    {
      token,
    },
  );
}

export function getSavedPropertiesCount(
  token: string,
) {
  return apiFetch<SavedPropertiesCountResponse>(
    "/saved-properties/count",
    {
      token,
    },
  );
}