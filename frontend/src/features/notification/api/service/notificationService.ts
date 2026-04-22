import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { NotificationPayload } from '@/features/notification/api/dtos/response.dto';
import { mapNotificationPayload } from '@/features/notification/api/mapper/mapper';
import type { NotificationItem } from '@/features/notification/types/contracts';
import type { ApiEnvelope, PagedResult } from '@/shared/types/api';

const { NOTIFICATIONS } = API_ENDPOINTS;

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
