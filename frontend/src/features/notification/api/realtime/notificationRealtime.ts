import { HubConnection } from '@microsoft/signalr';

import type { NotificationPayload } from '@/features/notification/api/dtos/response.dto';
import { mapNotificationPayload } from '@/features/notification/api/mapper/mapper';
import type { NotificationRealtimeHandlers } from '@/features/notification/types/realtime';
import { createAuthenticatedHubConnection, startHubConnection } from '@/shared/lib/signalr';

export const createNotificationRealtimeConnection = (
  handlers: NotificationRealtimeHandlers,
): HubConnection => {
  const connection = createAuthenticatedHubConnection({
    hubPath: '/hubs/notifications',
    reconnectDelaysMs: [0, 2000, 5000, 10000, 20000],
  });

  connection.on('NotificationCreated', (payload: NotificationPayload) => {
    handlers.onCreated(mapNotificationPayload(payload));
  });

  connection.on('NotificationUpdated', (payload: NotificationPayload) => {
    handlers.onUpdated(mapNotificationPayload(payload));
  });

  connection.on('NotificationDeleted', (notificationId: string) => {
    handlers.onDeleted(notificationId);
  });

  connection.on('NotificationsMarkedAllRead', () => {
    handlers.onMarkedAllRead();
  });

  return connection;
};

export const startNotificationRealtimeConnection = async (connection: HubConnection): Promise<void> => {
  await startHubConnection(connection);
};
