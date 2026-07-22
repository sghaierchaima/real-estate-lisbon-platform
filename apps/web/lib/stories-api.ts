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
export function createStoryWithImage(
  token: string,
  formData: FormData,
) {
  return apiFetch<Story>("/stories", {
    method: "POST",
    token,
    body: formData,
  });
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