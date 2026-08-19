const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.100.71:3001";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: options.method || "GET",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",

        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },

      ...(options.body !== undefined
        ? {
            body: JSON.stringify(options.body),
          }
        : {}),
    },
  );

  const raw = await response.text();

  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      const serverMessage = (
        data as {
          message?: string | string[];
        }
      ).message;

      if (Array.isArray(serverMessage)) {
        message = serverMessage.join(", ");
      } else if (serverMessage) {
        message = serverMessage;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

export function getApiUrl() {
  return API_URL;
}
export function getAssetUrl(
  url?: string | null,
) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_URL}${url}`;
}