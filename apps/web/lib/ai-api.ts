import { apiFetch } from "./api";

export type PropertySearchExtraction = {
  location: string;
  budget: string;
  propertyType: string;
  bedrooms: string;
  goal: string;
  mustHave: string[];
  summary: string;
  confidence: number;
};

export function extractPropertySearch(searchText: string) {
  return apiFetch<PropertySearchExtraction>("/ai/property-search/extract", {
    method: "POST",
    body: { searchText },
  });
}