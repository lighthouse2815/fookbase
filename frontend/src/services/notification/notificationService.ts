import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import { mapNotificationPayload } from '@/services/notification/util';
import type { NotificationItem, NotificationPayload } from '@/interface/notification';
import type { ApiEnvelope, PagedResult } from '@/interface/api';

const { NOTIFICATIONS } = API_CONFIG.ENDPOINTS;

export const notificationService = {
  async getMine(page = 1, pageSize = 20): Promise<NotificationItem[]> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<NotificationPayload>>>(NOTIFICATIONS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load notifications');
    return paged.items.map(mapNotificationPayload);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(NOTIFICATIONS.MARK_READ(notificationId));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(NOTIFICATIONS.READ_ALL);
  },
};
