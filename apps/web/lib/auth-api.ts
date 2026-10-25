import { apiFetch } from "./api";

export type UserRole = "ADMIN" | "BUYER" | "PROFESSIONAL";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
  isNewUser?: boolean;
};

export async function login(payload: {
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    logoutOnUnauthorized: false,
  });
}

export async function register(payload: {
  email: string;
  password: string;
  fullName?: string;
}) {
  return apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function getMe(token: string) {
  return apiFetch<{
    id: string;
    email: string;
    role: UserRole;
  }>("/auth/me", {
    token,
  });
}

export async function googleLogin(
  idToken: string,
) {
  return apiFetch<AuthResponse>(
    "/auth/google",
    {
      method: "POST",
      body: {
        idToken,
      },
      logoutOnUnauthorized: false,
    },
  );
}

export function forgotPassword(data: { email: string }) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: data,
  });
}

export function resetPassword(data: {
  token: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: data,
  });
}