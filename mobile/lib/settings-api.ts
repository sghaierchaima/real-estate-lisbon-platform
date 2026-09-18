import * as FileSystem from "expo-file-system/legacy";

import { apiFetch } from "./api";

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

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

// ============================================================
// MOBILE AVATAR FILE
// ============================================================

export type MobileAvatarFile = {
  uri: string;

  name: string;

  type: string;
};

// ============================================================
// GET CURRENT USER
// ============================================================

export function getMe(
  token: string,
) {
  return apiFetch<SettingsUser>(
    "/users/me",
    {
      token,
    },
  );
}

// ============================================================
// UPDATE CURRENT USER
// ============================================================

export function updateMe(
  token: string,
  data: {
    fullName?: string;

    phone?: string;

    country?: string;

    city?: string;
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

// ============================================================
// CHANGE PASSWORD
// ============================================================

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
    },
  );
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function getApiUrl() {
  const value =
    process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!value) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not configured.",
    );
  }

  return value.replace(/\/+$/, "");
}

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: string | string[];
      }
    ).message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }
  }

  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data;
  }

  return fallback;
}

// ============================================================
// MOBILE AVATAR UPLOAD
// ============================================================
//
// IMPORTANT:
//
// We intentionally do NOT use FormData here.
//
// React Native / Expo can produce:
//
// Unsupported FormDataPart implementation
//
// with local iOS/Android image URIs.
//
// FileSystem.uploadAsync handles multipart upload natively.
// ============================================================

export async function uploadAvatar(
  token: string,
  file: MobileAvatarFile,
): Promise<SettingsUser> {
  const API_URL =
    getApiUrl();

  if (!file.uri) {
    throw new Error(
      "The selected image does not contain a valid URI.",
    );
  }

  const uploadUrl =
    `${API_URL}/users/me/avatar`;

  const result =
    await FileSystem.uploadAsync(
      uploadUrl,
      file.uri,
      {
        httpMethod: "PATCH",

        uploadType:
          FileSystem.FileSystemUploadType.MULTIPART,

        fieldName:
          "avatar",

        mimeType:
          file.type ||
          "image/jpeg",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        parameters: {
          originalName:
            file.name,
        },
      },
    );

  let data: unknown = null;

  if (result.body) {
    try {
      data =
        JSON.parse(
          result.body,
        );
    } catch {
      data =
        result.body;
    }
  }

  if (
    result.status < 200 ||
    result.status >= 300
  ) {
    throw new Error(
      getErrorMessage(
        data,
        `Avatar upload failed (${result.status}).`,
      ),
    );
  }

  if (
    typeof data !== "object" ||
    data === null
  ) {
    throw new Error(
      "The server returned an invalid avatar response.",
    );
  }

  return data as SettingsUser;
}