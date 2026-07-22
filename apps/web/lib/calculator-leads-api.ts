import { apiFetch } from "./api";

export function createCalculatorLead(payload: {
  fullName?: string;
  email: string;
  phone?: string;
  source: string;
  interest?: string;
  location?: string;
  budget?: string;
  alreadyExists?: boolean;
}) {
  return apiFetch<{
    id: string;
    fullName: string | null;
    email: string | null;
    source: string | null;
    quality: "HOT" | "WARM" | "COLD";
    status: "NEW" | "CONTACTED" | "MATCHED" | "CLOSED" | "LOST";
    alreadyExists: boolean;
  }>("/leads/from-calculator", {
    method: "POST",
    body: payload,
  });
}