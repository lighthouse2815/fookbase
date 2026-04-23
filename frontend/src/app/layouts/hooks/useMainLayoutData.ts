import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import type { FriendRequest, FriendSuggestion } from '@/features/friendship/types/contracts';
import {
  createNotificationRealtimeConnection,
  startNotificationRealtimeConnection,
} from '@/features/notification/api/realtime/notificationRealtime';
import { notificationService } from '@/features/notification/api/service/notificationService';
import type { NotificationItem } from '@/features/notification/types/contracts';
import { userService } from '@/features/user/api/service/userService';
import type { User } from '@/features/user/types/contracts';
import {
  getNotificationKey,
  normalizeNotificationType,
  normalizePresenceUsers,
  sortNotifications,
} from '@/app/layouts/utils/mainLayout.util';

interface MainLayoutData {
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  offlineUsers: User[];
  notifications: NotificationItem[];
  onAddFriend: (friendId: string) => Promise<void>;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onAcceptFriendRequest: (notification: NotificationItem) => Promise<void>;
  onRejectFriendRequest: (notification: NotificationItem) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
}

export const useMainLayoutData = (): MainLayoutData => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const mapReceivedRequestToNotification = useCallback(
    (request: FriendRequest): NotificationItem => {
      const actorName = request.fullName?.trim() || request.username?.trim() || t('notifications.someone');

      return {
        id: `friend-request-${request.id}`,
        type: 'FRIEND_REQUEST',
        actorUserId: request.id,
        actorName,
        requestId: request.requestId,
        message: t('notifications.friendRequestMessage', { name: actorName }),
        createdAt: request.requestedAt ?? new Date().toISOString(),
        isRead: false,
        avatarUrl: request.avatarUrl,
        isVirtual: true,
      };
    },
    [t],
  );

  const loadRealtimeNotifications = useCallback(async () => {
    const [apiNotificationsResult, friendRequestsResult] = await Promise.allSettled([
      notificationService.getMine(1, 25),
      friendshipService.getReceivedRequests(),
    ]);

    if (apiNotificationsResult.status === 'rejected' && friendRequestsResult.status === 'rejected') {
      setNotifications([]);
      return;
    }

    const merged = new Map<string, NotificationItem>();

    if (apiNotificationsResult.status === 'fulfilled') {
      apiNotificationsResult.value.forEach((notification) => {
        merged.set(getNotificationKey(notification), notification);
      });
    }

    if (friendRequestsResult.status === 'fulfilled') {
      friendRequestsResult.value.forEach((request) => {
        const friendRequestNotification = mapReceivedRequestToNotification(request);
        merged.set(getNotificationKey(friendRequestNotification), friendRequestNotification);
      });
    }

    setNotifications(sortNotifications(Array.from(merged.values())));
  }, [mapReceivedRequestToNotification]);

  const applyPresenceUsers = useCallback((nextOnlineUsers: User[], nextOfflineUsers: User[]) => {
    const normalizedOnlineUsers = normalizePresenceUsers(nextOnlineUsers, true);
    const onlineUserIds = new Set(normalizedOnlineUsers.map((user) => user.id));
    const normalizedOfflineUsers = normalizePresenceUsers(nextOfflineUsers, false).filter(
      (user) => !onlineUserIds.has(user.id),
    );

    setOnlineUsers(normalizedOnlineUsers);
    setOfflineUsers(normalizedOfflineUsers);
  }, []);

  const loadFriendPresence = useCallback(async () => {
    try {
      const friendPresence = await userService.getFriendPresence();
      applyPresenceUsers(friendPresence.onlineUsers, friendPresence.offlineUsers);
      return;
    } catch {
      // Fallback below keeps compatibility when presence endpoint is unavailable.
    }

    const [onlineUsersResult, friendsResult] = await Promise.allSettled([
      userService.getOnlineUsers(),
      friendshipService.getFriends(),
    ]);

    if (onlineUsersResult.status === 'rejected' && friendsResult.status === 'rejected') {
      return;
    }

    const resolvedOnlineUsers = onlineUsersResult.status === 'fulfilled' ? onlineUsersResult.value : [];
    const onlineUserIds = new Set(resolvedOnlineUsers.map((user) => user.id));
    const resolvedOfflineUsers =
      friendsResult.status === 'fulfilled'
        ? friendsResult.value
            .filter((friend) => !onlineUserIds.has(friend.id))
            .map((friend) => ({
              ...friend,
              isOnline: false,
            }))
        : [];

    applyPresenceUsers(resolvedOnlineUsers, resolvedOfflineUsers);
  }, [applyPresenceUsers]);

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const nextSuggestions = await friendshipService.getFriendSuggestions();
        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      }

      await loadFriendPresence();
    };

    void loadSidebarData();
  }, [loadFriendPresence]);

  useEffect(() => {
    const refreshPresence = () => {
      void loadFriendPresence();
    };

    const intervalId = window.setInterval(refreshPresence, 30000);
    window.addEventListener('focus', refreshPresence);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshPresence);
    };
  }, [loadFriendPresence]);

  useEffect(() => {
    const initialSyncId = window.setTimeout(() => {
      void loadRealtimeNotifications();
    }, 0);

    const connection = createNotificationRealtimeConnection({
      onCreated: (notification) => {
        setNotifications((existing) => {
          const merged = new Map<string, NotificationItem>(
            existing.map((item) => [getNotificationKey(item), item]),
          );
          merged.set(getNotificationKey(notification), notification);
          return sortNotifications(Array.from(merged.values()));
        });
      },
      onUpdated: (notification) => {
        setNotifications((existing) =>
          existing.map((item) => (item.id === notification.id ? { ...item, ...notification } : item)),
        );
      },
      onDeleted: (notificationId) => {
        setNotifications((existing) => existing.filter((item) => item.id !== notificationId));
      },
      onMarkedAllRead: () => {
        setNotifications((existing) => existing.map((item) => ({ ...item, isRead: true })));
      },
    });

    connection.onreconnected(() => {
      void loadRealtimeNotifications();
    });

    void startNotificationRealtimeConnection(connection).catch(() => {
      void loadRealtimeNotifications();
    });

    const fallbackSyncIntervalId = window.setInterval(() => {
      void loadRealtimeNotifications();
    }, 45000);

    return () => {
      window.clearTimeout(initialSyncId);
      window.clearInterval(fallbackSyncIntervalId);
      void connection.stop();
    };
  }, [loadRealtimeNotifications]);

  useEffect(() => {
    const handleFocus = () => {
      void loadRealtimeNotifications();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadRealtimeNotifications]);

  useEffect(() => {
    const syncId = window.setTimeout(() => {
      void loadRealtimeNotifications();
    }, 0);

    return () => {
      window.clearTimeout(syncId);
    };
  }, [i18n.language, loadRealtimeNotifications]);

  const markNotificationAsRead = useCallback(async (notification: NotificationItem) => {
    setNotifications((existing) =>
      existing.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );

    if (notification.isVirtual) {
      return;
    }

    try {
      await notificationService.markAsRead(notification.id);
    } catch {
      // Keep optimistic read state.
    }
  }, []);

  const onOpenNotification = useCallback(
    async (notification: NotificationItem) => {
      await markNotificationAsRead(notification);

      const type = normalizeNotificationType(notification.type);

      if (type === 'FRIEND_REQUEST' && notification.actorUserId) {
        navigate(`/profile/${notification.actorUserId}`);
        return;
      }

      if (notification.postId) {
        navigate(`/posts/${notification.postId}`);
        return;
      }

      if (notification.actorUserId) {
        navigate(`/profile/${notification.actorUserId}`);
      }
    },
    [markNotificationAsRead, navigate],
  );

  const onAcceptFriendRequest = useCallback(
    async (notification: NotificationItem) => {
      const requestId = notification.requestId ?? notification.actorUserId;
      if (!requestId) {
        return;
      }

      await friendshipService.acceptFriendRequest(requestId);
      setNotifications((existing) => existing.filter((item) => item.id !== notification.id));
      void loadRealtimeNotifications();
    },
    [loadRealtimeNotifications],
  );

  const onRejectFriendRequest = useCallback(
    async (notification: NotificationItem) => {
      const requestId = notification.requestId ?? notification.actorUserId;
      if (!requestId) {
        return;
      }

      await friendshipService.deleteFriendRequest(requestId);
      setNotifications((existing) => existing.filter((item) => item.id !== notification.id));
      void loadRealtimeNotifications();
    },
    [loadRealtimeNotifications],
  );

  const onMarkAllNotificationsAsRead = useCallback(async () => {
    setNotifications((existing) => existing.map((item) => ({ ...item, isRead: true })));

    try {
      await notificationService.markAllAsRead();
    } catch {
      // Keep optimistic read state.
    }
  }, []);

  const onAddFriend = useCallback(async (friendId: string) => {
    try {
      await friendshipService.sendFriendRequest(friendId);
    } catch {
      // Allow optimistic UI updates even when backend is unavailable in local development.
    }

    setSuggestions((existing) => existing.filter((item) => item.id !== friendId));
  }, []);

  return {
    suggestions,
    onlineUsers,
    offlineUsers,
    notifications,
    onAddFriend,
    onOpenNotification,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onMarkAllNotificationsAsRead,
  };
};

