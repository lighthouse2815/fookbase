import type { NotificationItem } from '@/features/notification/types/contracts';

export interface NotificationRealtimeHandlers {
  onCreated: (notification: NotificationItem) => void;
  onUpdated: (notification: NotificationItem) => void;
  onDeleted: (notificationId: string) => void;
  onMarkedAllRead: () => void;
}
