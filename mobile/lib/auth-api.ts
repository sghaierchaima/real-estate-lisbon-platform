import { apiFetch } from "./api";
import type { AuthUser } from "@/types/auth";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
};

export type GoogleLoginPayload = {
  idToken: string;
};

export async function login(
  payload: LoginPayload,
) {
  return apiFetch<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function register(
  payload: RegisterPayload,
) {
  return apiFetch<LoginResponse>(
    "/auth/register",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function googleLogin(
  idToken: string,
) {
  return apiFetch<LoginResponse>(
    "/auth/google",
    {
      method: "POST",
      body: {
        idToken,
      },
    },
  );
}

export async function getMe(
  token: string,
) {
  return apiFetch<AuthUser>(
    "/auth/me",
    {
      token,
    },
  );
}