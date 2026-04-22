import type { FriendSuggestion } from '@/features/friendship/types/contracts';
import type { NotificationItem } from '@/features/notification/types/contracts';
import type { User } from '@/features/user/types/contracts';

export interface MainLayoutOutletContext {
  currentUser: User;
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  offlineUsers: User[];
  notifications: NotificationItem[];
}
