import { apiFetch } from "./api";

export type StoryStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type Story = {
  id: string;
  userId: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  location: string | null;
  imageUrl: string | null;
  status: StoryStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;

  user?: {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
  } | null;
};

/**
 * Admin:
 * récupérer toutes les success stories.
 */
export function getStories(token: string) {
  return apiFetch<Story[]>("/stories", {
    token,
  });
}

/**
 * Public:
 * récupérer uniquement les stories approuvées.
 */
export function getPublicStories() {
  return apiFetch<Story[]>("/stories/public");
}

/**
 * Public:
 * récupérer une story approuvée par son identifiant.
 */
export function getPublicStory(id: string) {
  return apiFetch<Story>(
    `/stories/public/${encodeURIComponent(id)}`,
  );
}

/**
 * Buyer:
 * soumettre une nouvelle story avec une image.
 */
export async function createStoryWithImage(
  token: string,
  formData: FormData,
) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  const response = await fetch(
    `${apiUrl}/stories`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    },
  );

  if (!response.ok) {
    let message =
      "Error submitting story.";

    try {
      const data = await response.json();

      if (Array.isArray(data?.message)) {
        message = data.message.join(", ");
      } else if (
        typeof data?.message === "string"
      ) {
        message = data.message;
      }
    } catch {
      const text = await response.text();

      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Admin:
 * approuver ou rejeter une story.
 */
export function updateStoryStatus(
  token: string,
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  return apiFetch<Story>(
    `/stories/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      token,
      body: {
        status,
      },
    },
  );
}

/**
 * Admin:
 * supprimer une story.
 */
export function deleteStory(
  token: string,
  id: string,
) {
  return apiFetch<{
    message: string;
  }>(
    `/stories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
    },
  );
}
export function getMyStories(
  token: string,
) {
  return apiFetch<Story[]>(
    "/stories/me",
    {
      token,
    },
  );
}