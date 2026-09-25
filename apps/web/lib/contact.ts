import {
  apiFetch,
} from "@/lib/api";

/*
 * ============================================================
 * CONTACT API
 * ============================================================
 *
 * Centralises all API calls related to contact messages.
 *
 * PUBLIC:
 * - createContactMessage
 *
 * ADMIN:
 * - getAdminContactMessages
 * - getAdminContactMessage
 * - markContactMessageAsRead
 * - markContactMessageAsUnread
 * - deleteContactMessage
 *
 * ============================================================
 */


/*
 * ============================================================
 * TYPES
 * ============================================================
 */

export type ContactMessagePayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactMessage = {
  id: string;

  name: string;
  email: string;
  subject: string;
  message: string;

  isRead: boolean;

  createdAt: string;
  updatedAt: string;
};

export type CreateContactMessageResponse = {
  success: boolean;

  message: string;

  contactMessage: {
    id: string;
    createdAt: string;
  };
};

export type DeleteContactMessageResponse = {
  success: boolean;
  message: string;
};


/*
 * ============================================================
 * PUBLIC
 * CREATE CONTACT MESSAGE
 * ============================================================
 */

export function createContactMessage(
  data: ContactMessagePayload,
) {
  return apiFetch<CreateContactMessageResponse>(
    "/contact",
    {
      method: "POST",

      body: data,
    },
  );
}


/*
 * ============================================================
 * ADMIN
 * GET ALL CONTACT MESSAGES
 * ============================================================
 */

export function getAdminContactMessages(
  token: string,
) {
  return apiFetch<ContactMessage[]>(
    "/contact/admin",
    {
      method: "GET",

      token,
    },
  );
}


/*
 * ============================================================
 * ADMIN
 * GET ONE CONTACT MESSAGE
 * ============================================================
 */

export function getAdminContactMessage(
  token: string,
  id: string,
) {
  return apiFetch<ContactMessage>(
    `/contact/admin/${id}`,
    {
      method: "GET",

      token,
    },
  );
}


/*
 * ============================================================
 * ADMIN
 * MARK AS READ
 * ============================================================
 */

export function markContactMessageAsRead(
  token: string,
  id: string,
) {
  return apiFetch<ContactMessage>(
    `/contact/admin/${id}/read`,
    {
      method: "PATCH",

      token,
    },
  );
}


/*
 * ============================================================
 * ADMIN
 * MARK AS UNREAD
 * ============================================================
 */

export function markContactMessageAsUnread(
  token: string,
  id: string,
) {
  return apiFetch<ContactMessage>(
    `/contact/admin/${id}/unread`,
    {
      method: "PATCH",

      token,
    },
  );
}


/*
 * ============================================================
 * ADMIN
 * DELETE CONTACT MESSAGE
 * ============================================================
 */

export function deleteContactMessage(
  token: string,
  id: string,
) {
  return apiFetch<DeleteContactMessageResponse>(
    `/contact/admin/${id}`,
    {
      method: "DELETE",

      token,
    },
  );
}