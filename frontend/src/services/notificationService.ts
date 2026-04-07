import { apiClient } from './apiClient';
import type { NotificationItem } from '../types/notification';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  actorUserId: string;
  postId?: string | null;
  commentId?: string | null;
  type?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

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

export const notificationService = {
  async getMine(page = 1, pageSize = 20): Promise<NotificationItem[]> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<NotificationPayload>>>('/api/notifications', {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load notifications');
    return paged.items.map(mapNotificationPayload);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/api/notifications/read-all');
  },
};
