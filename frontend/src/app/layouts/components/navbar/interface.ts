import type { NotificationItem } from '@/features/notification/types/contracts';
import type { User } from '@/features/user/types/contracts';

export interface NavbarProps {
  currentUser: User;
  notifications: NotificationItem[];
  onOpenNotification: (item: NotificationItem) => void;
  onAcceptFriendRequest: (item: NotificationItem) => Promise<void>;
  onRejectFriendRequest: (item: NotificationItem) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
  onLogout: () => void;
}
