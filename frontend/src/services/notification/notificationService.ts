import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';

const { NOTIFICATIONS } = API_CONFIG.ENDPOINTS;
import type { NotificationItem, NotificationPayload } from '@/interface/notification';
import type { ApiEnvelope } from '@/interface/api';
import type { PagedResult } from '@/interface/api';

export type { NotificationPayload };

export const mapNotificationPayload = (payload: NotificationPayload): NotificationItem => ({
  id: payload.id,
  message: payload.message,
  createdAt: payload.createdAt,
  isRead: payload.isRead,
  type: payload.type ?? 'GENERAL',
  actorUserId: payload.actorUserId,
  postId: payload.postId ?? undefined,
  commentId: payload.commentId ?? undefined,
});

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

const mapNotification = (payload: NotificationPayload): NotificationItem => ({
  id: payload.id,
  message: payload.message,
  createdAt: payload.createdAt,
  isRead: payload.isRead,
  type: payload.type ?? 'GENERAL',
  actorUserId: payload.actorUserId,
  postId: payload.postId ?? undefined,
  commentId: payload.commentId ?? undefined,
});

export const notificationService = {
  async getMine(page = 1, pageSize = 20): Promise<NotificationItem[]> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<NotificationPayload>>>(NOTIFICATIONS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load notifications');
    return paged.items.map(mapNotification);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(NOTIFICATIONS.MARK_READ(notificationId));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(NOTIFICATIONS.READ_ALL);
  },
};
