import { apiFetch } from "./api";
import { getToken } from "./session";

export type CalculatorLeadPayload = {
  fullName?: string;
  email: string;
  phone?: string;
  source: string;
  interest?: string;
  location?: string;
  budget?: string;
};

export type CalculatorLeadResponse = {
  id: string;
  fullName: string | null;
  email: string | null;
  source: string | null;
  quality: "HOT" | "WARM" | "COLD";
  status:
    | "NEW"
    | "CONTACTED"
    | "MATCHED"
    | "CLOSED"
    | "LOST";
  alreadyExists: boolean;
};

export function createCalculatorLead(
  payload: CalculatorLeadPayload
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "You must be signed in to submit a request."
    );
  }

  return apiFetch<CalculatorLeadResponse>(
    "/leads/from-calculator",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}