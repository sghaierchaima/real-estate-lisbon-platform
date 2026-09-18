import { apiFetch } from "./api";

/* ============================================================
   CONFIG
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ============================================================
   USER SETTINGS TYPES
============================================================ */

export type SettingsUser = {
  id: string;
  email: string;
  fullName: string | null;

  role:
    | "ADMIN"
    | "BUYER"
    | "PROFESSIONAL";

  phone: string | null;
  country: string | null;
  city: string | null;
  avatarUrl: string | null;

  emailNotifications: boolean;
  leadNotifications: boolean;
  matchNotifications: boolean;
  propertyAlertNotifications: boolean;
};

/* ============================================================
   PROFESSIONAL SETTINGS TYPES
============================================================ */

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

/* ============================================================
   NOTIFICATION PREFERENCES
============================================================ */

export type NotificationPreferencesPayload = {
  emailNotifications: boolean;
  leadNotifications: boolean;
  matchNotifications: boolean;
  propertyAlertNotifications: boolean;
};

export type NotificationPreferencesResponse = {
  id: string;

  emailNotifications: boolean;
  leadNotifications: boolean;
  matchNotifications: boolean;
  propertyAlertNotifications: boolean;
};

/* ============================================================
   GET CURRENT USER
============================================================ */

export function getMe(token: string) {
  return apiFetch<SettingsUser>(
    "/users/me",
    {
      token,
    },
  );
}

/* ============================================================
   UPDATE CURRENT USER
============================================================ */

export function updateMe(
  token: string,
  data: {
    fullName?: string;
    phone?: string;
    country?: string;
    city?: string;
    avatarUrl?: string;
  },
) {
  return apiFetch<SettingsUser>(
    "/users/me",
    {
      method: "PATCH",
      token,
      body: data,
    },
  );
}

/* ============================================================
   PROFESSIONAL PROFILE
============================================================ */

export function getMyProfessionalProfile(
  token: string,
) {
  return apiFetch<ProfessionalSettingsProfile>(
    "/professionals/me",
    {
      token,
    },
  );
}

/* ============================================================
   UPDATE PROFESSIONAL PROFILE
============================================================ */

export function updateMyProfessionalProfile(
  token: string,
  data: {
    companyName?: string;
    professionalType?: string;
    bio?: string;
    languages?: string[];
  },
) {
  return apiFetch<ProfessionalSettingsProfile>(
    "/professionals/me",
    {
      method: "PATCH",
      token,
      body: data,
    },
  );
}

/* ============================================================
   UPLOAD AVATAR
============================================================ */

export async function uploadAvatar(
  token: string,
  file: File,
): Promise<SettingsUser> {
  const formData = new FormData();

  formData.append("avatar", file);

  const response = await fetch(
    `${API_URL}/users/me/avatar`,
    {
      method: "PATCH",

      /*
       * IMPORTANT:
       * Ne pas ajouter Content-Type ici.
       *
       * Le navigateur génère automatiquement :
       * multipart/form-data + boundary.
       */

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    let message =
      "Avatar upload failed";

    if (
      typeof data?.message === "string"
    ) {
      message = data.message;
    } else if (
      Array.isArray(data?.message)
    ) {
      message =
        data.message.join(", ");
    }

    throw new Error(message);
  }

  return data as SettingsUser;
}

/* ============================================================
   CHANGE PASSWORD
============================================================ */

export function changePassword(
  token: string,
  data: {
    currentPassword: string;
    newPassword: string;
  },
) {
  return apiFetch<{
    message: string;
  }>(
    "/auth/change-password",
    {
      method: "PATCH",

      token,

      body: data,

      /*
       * TRÈS IMPORTANT
       *
       * Le backend peut retourner 401 lorsque
       * currentPassword est incorrect.
       *
       * Ce 401 est une erreur de validation du mot
       * de passe et NON une session expirée.
       *
       * Donc apiFetch ne doit PAS appeler clearSession().
       */

      logoutOnUnauthorized: false,
    },
  );
}

/* ============================================================
   UPDATE NOTIFICATION PREFERENCES
============================================================ */

export function updateNotificationPreferences(
  token: string,
  data: NotificationPreferencesPayload,
) {
  return apiFetch<NotificationPreferencesResponse>(
    "/users/me/notification-preferences",
    {
      method: "PATCH",

      token,

      body: data,
    },
  );
}