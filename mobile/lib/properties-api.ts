import { apiFetch } from "./api";
import type { Property } from "@/types/property";

export async function getPublicProperties() {
  return apiFetch<Property[]>(
    "/properties/public",
  );
}

export async function getPublicProperty(
  id: string,
) {
  return apiFetch<Property>(
    `/properties/public/${id}`,
  );
}