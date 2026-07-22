import { apiFetch } from "./api";

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

  schoolsCount: number;
  transportCount: number;
  amenitiesCount: number;

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
  createdAt: string;
  updatedAt: string;
};

export function getNeighborhoods() {
  return apiFetch<Neighborhood[]>("/neighborhoods");
}

export function getRecommendedNeighborhoods(params: {
  budgetMax?: string;
  profile?: string;
  goal?: string;
  search?: string;
}) {
  const query = new URLSearchParams();

  if (params.budgetMax) query.set("budgetMax", params.budgetMax);
  if (params.profile) query.set("profile", params.profile);
  if (params.goal) query.set("goal", params.goal);
  if (params.search) query.set("search", params.search);

  return apiFetch<Neighborhood[]>(
    `/neighborhoods/recommend?${query.toString()}`
  );
}
export function getNeighborhood(id: string) {
  return apiFetch<Neighborhood>(`/neighborhoods/${id}`);
}