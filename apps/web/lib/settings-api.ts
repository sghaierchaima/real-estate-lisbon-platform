import { apiFetch } from "./api";

export type SettingsUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "ADMIN" | "BUYER" | "PROFESSIONAL";
  phone: string | null;
  country: string | null;
  city: string | null;
  avatarUrl: string | null;
};

export type ProfessionalSettingsProfile = {
  id: string;
  userId: string;
  professionalType: string;
  companyName: string | null;
  bio: string | null;
  languages: string[];
  rating: number;
  reviewsCount: number;
  clientsCount: number;
  verificationStatus: string;
  isFeatured: boolean;
  profileCompletion: number;
};

export function getMe(token: string) {
  return apiFetch<SettingsUser>("/users/me", { token });
}

export function updateMe(
  token: string,
  data: {
    fullName?: string;
    phone?: string;
    country?: string;
    city?: string;
    avatarUrl?: string;
  }
) {
  return apiFetch<SettingsUser>("/users/me", {
    method: "PATCH",
    token,
    body: data,
  });
}

export function getMyProfessionalProfile(token: string) {
  return apiFetch<ProfessionalSettingsProfile>("/professionals/me", { token });
}

export function updateMyProfessionalProfile(
  token: string,
  data: {
    companyName?: string;
    professionalType?: string;
    bio?: string;
    languages?: string[];
  }
) {
  return apiFetch<ProfessionalSettingsProfile>("/professionals/me", {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function uploadAvatar(
  token: string,
  file: File
) {
  const formData = new FormData();

  formData.append("avatar", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Avatar upload failed");
  }

  return response.json();
}
export function changePassword(
  token: string,
  data: {
    currentPassword: string;
    newPassword: string;
  }
) {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "PATCH",
    token,
    body: data,
  });
}