export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  role:
    | "ADMIN"
    | "BUYER"
    | "PROFESSIONAL";
  avatarUrl?: string | null;
};

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

export function saveSession(
  token: string,
  user: unknown,
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "accessToken",
    token,
  );

  localStorage.setItem(
    "user",
    JSON.stringify(user),
  );
}

function decodeJwtPayload(
  token: string,
): JwtPayload | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const tokenParts =
      token.split(".");

    if (tokenParts.length !== 3) {
      return null;
    }

    const payloadPart =
      tokenParts[1];

    if (!payloadPart) {
      return null;
    }

    const normalizedPayload =
      payloadPart
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const paddedPayload =
      normalizedPayload.padEnd(
        normalizedPayload.length +
          ((4 -
            (normalizedPayload.length %
              4)) %
            4),
        "=",
      );

    const decodedPayload =
      window.atob(paddedPayload);

    return JSON.parse(
      decodedPayload,
    ) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(
  token: string,
): boolean {
  const payload =
    decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  const expirationTime =
    payload.exp * 1000;

  return (
    Date.now() >= expirationTime
  );
}

export function clearSession() {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "accessToken",
  );

  localStorage.removeItem("user");
}

export function getToken():
  | string
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const token =
    localStorage.getItem(
      "accessToken",
    );

  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearSession();
    return null;
  }

  return token;
}

export function getStoredUser<T>():
  | T
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const token = getToken();

  if (!token) {
    return null;
  }

  const rawUser =
    localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(
      rawUser,
    ) as T;
  } catch {
    clearSession();
    return null;
  }
}

export function getSessionUser():
  | SessionUser
  | null {
  return getStoredUser<SessionUser>();
}