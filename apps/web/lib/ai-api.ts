import { apiFetch } from "./api";

export type PropertySearchExtraction = {
  location: string;
  budget: string;
  minBudget: number | null;
  maxBudget: number | null;
  propertyType: string;
  bedrooms: string;
  bathrooms?: string;
  minArea?: number | null;
  maxArea?: number | null;
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

export async function explainPropertyMatches(
  searchText: string,
  properties: {
    title: string;
    price: number;
    city?: string | null;
    region?: string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;
    matchScore: number;
  }[]
) {
  return apiFetch<{
    summary: string;
    recommendations: {
      title: string;
      explanation: string;
    }[];
  }>("/ai/explain-property-matches", {
    method: "POST",
    body: {
      searchText,
      properties,
    },
  });
}