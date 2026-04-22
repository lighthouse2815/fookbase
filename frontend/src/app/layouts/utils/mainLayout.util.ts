import type { NotificationItem } from '@/features/notification/types/contracts';
import type { User } from '@/features/user/types/contracts';

export interface MainLayoutVisibilityState {
  isProfilePage: boolean;
  hideLeftSidebar: boolean;
  hideRightSidebar: boolean;
}

export const getMainLayoutVisibilityState = (pathname: string): MainLayoutVisibilityState => {
  const isFriendsPage = pathname.startsWith('/friends');
  const isProfilePage = /^\/profile(?:\/[^/]+)?\/?$/.test(pathname);
  const isSettingsPage = pathname.startsWith('/settings');
  const isMessagesPage = pathname.startsWith('/messages');
  const hideLeftSidebar = isFriendsPage || isProfilePage || isSettingsPage || isMessagesPage;
  const hideRightSidebar = hideLeftSidebar || isMessagesPage;

  return {
    isProfilePage,
    hideLeftSidebar,
    hideRightSidebar,
  };
};

export const normalizeNotificationType = (value?: string): string => {
  return value?.trim().toUpperCase() ?? 'GENERAL';
};

export const getNotificationKey = (item: NotificationItem): string => {
  const type = normalizeNotificationType(item.type);
  if (type === 'FRIEND_REQUEST' && item.actorUserId) {
    return `friend-request-${item.actorUserId}`;
  }

  return item.id;
};

export const sortNotifications = (items: NotificationItem[]): NotificationItem[] => {
  return [...items].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();
    return secondTime - firstTime;
  });
};

export const normalizePresenceUsers = (users: User[], isOnline: boolean): User[] => {
  const dedupedById = new Map<string, User>();

  users.forEach((user) => {
    dedupedById.set(user.id, {
      ...user,
      isOnline,
    });
  });

  return Array.from(dedupedById.values());
};
