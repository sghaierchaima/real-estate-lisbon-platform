import { apiFetch } from './api';

export type NotificationType =
  | 'MATCH'
  | 'LEAD'
  | 'STORY'
  | 'SYSTEM';

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'read';

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export function getNotifications(
  token: string,
) {
  return apiFetch<NotificationItem[]>(
    '/notifications',
    {
      token,
    },
  );
}



export function getUnreadNotificationCount(
  token: string,
) {
  return apiFetch<{ count: number }>(
    '/notifications/unread-count',
    {
      token,
    },
  );
}

export function markNotificationAsRead(
  token: string,
  id: string,
) {
  return apiFetch<NotificationItem>(
    `/notifications/${id}/read`,
    {
      method: 'PATCH',
      token,
    },
  );
}

export function markAllNotificationsAsRead(
  token: string,
) {
  return apiFetch<{
    message: string;
    updatedCount: number;
  }>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}

export function deleteNotification(
  token: string,
  id: string,
) {
  return apiFetch<{ message: string }>(
    `/notifications/${id}`,
    {
      method: 'DELETE',
      token,
    },
  );
}