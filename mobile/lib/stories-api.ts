import {
  apiFetch,
} from "./api";

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

export type MobileStoryImage = {
  uri: string;
  name: string;
  type: string;
};

export type CreateStoryPayload = {
  title: string;
  author: string;
  location?: string;
  excerpt?: string;
  content?: string;
  image?: MobileStoryImage | null;
};

/* PUBLIC */

export function getPublicStories() {
  return apiFetch<Story[]>(
    "/stories/public",
  );
}

export function getPublicStory(
  id: string,
) {
  return apiFetch<Story>(
    `/stories/public/${encodeURIComponent(
      id,
    )}`,
  );
}

/* BUYER */

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

export async function createStoryWithImage(
  token: string,
  payload: CreateStoryPayload,
) {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not configured.",
    );
  }

  const formData =
    new FormData();

  formData.append(
    "title",
    payload.title,
  );

  formData.append(
    "author",
    payload.author,
  );

  if (
    payload.location
  ) {
    formData.append(
      "location",
      payload.location,
    );
  }

  if (
    payload.excerpt
  ) {
    formData.append(
      "excerpt",
      payload.excerpt,
    );
  }

  if (
    payload.content
  ) {
    formData.append(
      "content",
      payload.content,
    );
  }

  if (
    payload.image
  ) {
    formData.append(
      "images",
      {
        uri:
          payload.image.uri,
        name:
          payload.image.name,
        type:
          payload.image.type,
      } as any,
    );
  }

  const response =
    await fetch(
      `${apiUrl}/stories`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        /*
         * Do NOT set Content-Type here.
         * React Native creates the multipart boundary.
         */
        body: formData,
      },
    );

  const raw =
    await response.text();

  let data: unknown =
    null;

  if (raw) {
    try {
      data =
        JSON.parse(
          raw,
        );
    } catch {
      data = raw;
    }
  }

  if (
    !response.ok
  ) {
    let message =
      "Error submitting story.";

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
        serverMessage
      ) {
        message =
          serverMessage;
      }
    } else if (
      typeof data ===
      "string"
    ) {
      message =
        data;
    }

    throw new Error(
      message,
    );
  }

  return data as Story;
}
