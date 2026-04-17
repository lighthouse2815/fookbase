import type { NotificationItem } from '@/interface/notification';

export interface NotificationRealtimeHandlers {
  onCreated: (notification: NotificationItem) => void;
  onUpdated: (notification: NotificationItem) => void;
  onDeleted: (notificationId: string) => void;
  onMarkedAllRead: () => void;
}
