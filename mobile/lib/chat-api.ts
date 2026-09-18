import { apiFetch } from "./api";

export type ChatMessage = {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  status: "SENT" | "READ";
  readAt: string | null;
};

export type ChatRoom = {
  id: string;
  matchId: string;
  buyerId: string;
  professionalId: string;
  createdAt: string;
  updatedAt: string;

  messages: ChatMessage[];

  match: {
    lead: {
      fullName: string | null;
      email: string | null;
      location: string | null;
      budget: string | null;
    } | null;

    buyer: {
      id: string;
      fullName: string | null;
      email: string;
    } | null;

    professional: {
      companyName: string | null;

      professionalType?: string | null;

      user: {
        fullName: string | null;
        email: string;
      };
    };
  };
};

export function getChatRooms(
  token: string,
) {
  return apiFetch<ChatRoom[]>(
    "/chat/rooms",
    {
      token,
    },
  );
}

export function getChatRoom(
  token: string,
  id: string,
) {
  return apiFetch<ChatRoom>(
    `/chat/rooms/${id}`,
    {
      token,
    },
  );
}

export function sendMessage(
  token: string,
  chatRoomId: string,
  content: string,
) {
  return apiFetch<ChatMessage>(
    "/chat/messages",
    {
      method: "POST",

      token,

      body: {
        chatRoomId,
        content,
      },
    },
  );
}

export function markChatRoomAsRead(
  token: string,
  id: string,
) {
  return apiFetch<{
    message: string;
  }>(
    `/chat/rooms/${id}/read`,
    {
      method: "PATCH",
      token,
    },
  );
}

export function getUnreadChatCount(
  token: string,
) {
  return apiFetch<{
    count: number;
  }>(
    "/chat/unread-count",
    {
      token,
    },
  );
}