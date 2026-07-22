import { apiFetch } from "./api";

export type UserRole = "ADMIN" | "BUYER" | "PROFESSIONAL";

export type UserItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  phone: string | null;
  country: string | null;
  city: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getUsers(token: string) {
  return apiFetch<UserItem[]>("/users", { token });
}

export function getUser(token: string, id: string) {
  return apiFetch<UserItem>(`/users/${id}`, { token });
}

export function deleteUser(token: string, id: string) {
  return apiFetch<{ message: string }>(`/users/${id}`, {
    method: "DELETE",
    token,
  });
}

export type ProfileProgress = {
  id: string;
  fullName: string | null;
  email: string;
  role: "ADMIN" | "BUYER" | "PROFESSIONAL";
  profileCompletion: number;
  profileTier: "REGISTERED" | "EXPLORER" | "ACTIVE_BUYER" | "QUALIFIED" | "PRIORITY";
};

export function getProfileProgress(token: string) {
  return apiFetch<ProfileProgress>("/users/profile-progress", {
    token,
  });
}