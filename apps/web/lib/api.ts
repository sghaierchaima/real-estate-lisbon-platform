import { clearSession } from "./session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ============================================================
   API TYPES
============================================================ */

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;

  /**
   * Par défaut :
   * un 401 signifie que la session n'est plus valide.
   *
   * Certaines routes peuvent cependant retourner 401
   * pour une erreur métier, par exemple :
   * "Current password is incorrect".
   *
   * Dans ce cas :
   * logoutOnUnauthorized: false
   */
  logoutOnUnauthorized?: boolean;
};

/* ============================================================
   API FETCH
============================================================ */

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
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

    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  /* ==========================================================
     READ RESPONSE
  ========================================================== */

  const data = await res.json().catch(() => null);

  /* ==========================================================
     ERROR HANDLING
  ========================================================== */

  if (!res.ok) {
    /*
     * IMPORTANT
     *
     * 401 ne provoque une déconnexion automatique
     * que si logoutOnUnauthorized n'est pas false.
     *
     * Cela permet par exemple à change-password
     * d'afficher "Current password is incorrect"
     * sans déconnecter l'utilisateur.
     */

    if (
      res.status === 401 &&
      options.logoutOnUnauthorized !== false
    ) {
      clearSession();

      if (typeof window !== "undefined") {
        window.location.replace(
          "/login?reason=session-expired",
        );
      }

      throw new Error("Session expired");
    }

    /* --------------------------------------------------------
       Extract backend error message
    -------------------------------------------------------- */

    let message = "API request failed";

    if (typeof data?.message === "string") {
      message = data.message;
    } else if (Array.isArray(data?.message)) {
      message = data.message.join(", ");
    } else if (typeof data?.error === "string") {
      message = data.error;
    }

    throw new Error(message);
  }

  return data as T;
}

/* ============================================================
   ASSET URL HELPER
============================================================ */

export function getAssetUrl(
  path?: string | null,
  fallback = "/images/prop1.png",
) {
  if (!path) {
    return fallback;
  }

  const cleanPath = path.trim();

  if (!cleanPath) {
    return fallback;
  }

  /* ----------------------------------------------------------
     Full external URL / browser-generated URL
  ---------------------------------------------------------- */

  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("blob:") ||
    cleanPath.startsWith("data:")
  ) {
    return cleanPath;
  }

  /* ----------------------------------------------------------
     Local Next.js image
  ---------------------------------------------------------- */

  if (cleanPath.startsWith("/images/")) {
    return cleanPath;
  }

  /* ----------------------------------------------------------
     Backend asset
     Example:
     /uploads/avatars/avatar.jpg
  ---------------------------------------------------------- */

  return `${API_URL}${
    cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`
  }`;
}