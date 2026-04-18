import type { NotificationItem } from '@/interface/notification';
import type { User } from '@/interface/user';

export interface NavbarProps {
  currentUser: User;
  notifications: NotificationItem[];
  onOpenNotification: (item: NotificationItem) => void;
  onAcceptFriendRequest: (item: NotificationItem) => Promise<void>;
  onRejectFriendRequest: (item: NotificationItem) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
  onLogout: () => void;
}
