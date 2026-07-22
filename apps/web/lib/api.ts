
import { clearSession } from "./session";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`,
          }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
  if (res.status === 401) {
    clearSession();

    if (typeof window !== "undefined") {
      window.location.replace("/login?reason=session-expired");
    }

    throw new Error("Session expired");
  }

  throw new Error(data?.message || "API request failed");
}

  return data;
}

/* ============================================================
   Asset URL Helper
============================================================ */

export function getAssetUrl(
  path?: string | null,
  fallback = "/images/prop1.png"
) {
  if (!path) {
    return fallback;
  }

  // URL complète
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Image locale de Next.js
  if (path.startsWith("/images/")) {
    return path;
  }

  // Image provenant du backend
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}