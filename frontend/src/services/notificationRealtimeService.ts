import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import type { NotificationPayload } from '@/interface/notification';
import { storage } from '@/utils/storage';
import { mapNotificationPayload } from '@/services/notification/util';
import type { NotificationRealtimeHandlers } from '@/services/notificationRealtime/interface';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7000';
const notificationsHubUrl = `${apiBaseUrl.replace(/\/+$/, '')}/hubs/notifications`;

export const createNotificationRealtimeConnection = (
  handlers: NotificationRealtimeHandlers,
): HubConnection => {
  const connection = new HubConnectionBuilder()
    .withUrl(notificationsHubUrl, {
      withCredentials: true,
      accessTokenFactory: () => storage.getToken() ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();

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
  if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting) {
    return;
  }

  await connection.start();
};
