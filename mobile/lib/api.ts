const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim();

if (!rawApiUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_URL. Configure it in the mobile environment.",
  );
}

/*
 * Remove trailing slashes so:
 *
 * https://api.example.com/
 *
 * becomes:
 *
 * https://api.example.com
 */
export const API_URL =
  rawApiUrl.replace(
    /\/+$/,
    "",
  );

type ApiFetchOptions = {
  method?:
    | "GET"
    | "POST"
    | "PATCH"
    | "PUT"
    | "DELETE";

  token?: string | null;

  body?: unknown;
};

function normalizeEndpoint(
  endpoint: string,
) {
  if (!endpoint) {
    return "";
  }

  return endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url =
    `${API_URL}${normalizeEndpoint(
      endpoint,
    )}`;

  let response: Response;

  try {
    response = await fetch(
      url,
      {
        method:
          options.method ??
          "GET",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.token
            ? {
                Authorization:
                  `Bearer ${options.token}`,
              }
            : {}),
        },

        ...(options.body !==
        undefined
          ? {
              body:
                JSON.stringify(
                  options.body,
                ),
            }
          : {}),
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the server. Check your connection and API configuration.",
    );
  }

  const raw =
    await response.text();

  let data: unknown =
    null;

  if (raw) {
    try {
      data =
        JSON.parse(raw);
    } catch {
      data =
        raw;
    }
  }

  if (!response.ok) {
    let message =
      `Request failed (${response.status})`;

    if (
      typeof data ===
        "object" &&
      data !== null &&
      "message" in data
    ) {
      const serverMessage =
        (
          data as {
            message?:
              | string
              | string[];
          }
        ).message;

      if (
        Array.isArray(
          serverMessage,
        )
      ) {
        message =
          serverMessage.join(
            ", ",
          );
      } else if (
        typeof serverMessage ===
          "string" &&
        serverMessage.trim()
      ) {
        message =
          serverMessage;
      }
    }

    throw new Error(
      message,
    );
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

  const cleanUrl =
    url.trim();

  if (!cleanUrl) {
    return null;
  }

  if (
    /^https?:\/\//i.test(
      cleanUrl,
    )
  ) {
    return cleanUrl;
  }

  return `${API_URL}${normalizeEndpoint(
    cleanUrl,
  )}`;
}