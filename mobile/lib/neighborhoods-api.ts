import {
  apiFetch,
} from "./api";

export type Neighborhood = {
  id: string;

  name: string;

  zone: string | null;

  description: string | null;

  tags: string[];

  highlights: string[];

  avgPrice: number | null;

  pricePerSqm: number | null;

  rentYield: number | null;

  growthPercent: number | null;

  schoolsCount?: number;

  transportCount?: number;

  amenitiesCount?: number;

  schoolsScore: number | null;

  transportScore: number | null;

  amenitiesScore: number | null;

  safetyScore: number | null;

  aiScore: number | null;

  aiSummary: string | null;

  icon: string | null;

  latitude: number | null;

  longitude: number | null;

  sourceNotes: string | null;

  createdAt?: string;

  updatedAt?: string;
};

export function getNeighborhoods() {
  return apiFetch<
    Neighborhood[]
  >(
    "/neighborhoods",
  );
}

export function getNeighborhood(
  id: string,
) {
  return apiFetch<
    Neighborhood
  >(
    `/neighborhoods/${id}`,
  );
}