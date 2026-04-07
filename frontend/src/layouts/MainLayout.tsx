import { House, UserRound, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SidebarLeft } from '../components/SidebarLeft';
import { SidebarRight } from '../components/SidebarRight';
import { useAuth } from '../contexts/AuthContext';
import {
  onlineUsers as onlineUsersMock,
} from '../data/mockData';
import { friendshipService } from '../services/friendshipService';
import {
  createNotificationRealtimeConnection,
  startNotificationRealtimeConnection,
} from '../services/notificationRealtimeService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';
import type { FriendRequest, FriendSuggestion } from '../types/friendship';
import type { NotificationItem } from '../types/notification';
import type { User } from '../types/user';

export interface MainLayoutOutletContext {
  currentUser: User;
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  offlineUsers: User[];
  notifications: NotificationItem[];
}

const normalizeNotificationType = (value?: string) => value?.trim().toUpperCase() ?? 'GENERAL';

const getNotificationKey = (item: NotificationItem): string => {
  const type = normalizeNotificationType(item.type);
  if (type === 'FRIEND_REQUEST' && item.actorUserId) {
    return `friend-request-${item.actorUserId}`;
  }

  return item.id;
};

const sortNotifications = (items: NotificationItem[]): NotificationItem[] => {
  return [...items].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();
    return secondTime - firstTime;
  });
};

export const MainLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>(onlineUsersMock);
  const [offlineUsers, setOfflineUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const isFriendsPage = location.pathname.startsWith('/friends');
  const isProfilePage = /^\/profile(?:\/[^/]+)?\/?$/.test(location.pathname);
  const isSettingsPage = location.pathname.startsWith('/settings');
  const useSingleColumnLayout = isFriendsPage || isProfilePage || isSettingsPage;

  const mapReceivedRequestToNotification = useCallback((request: FriendRequest): NotificationItem => {
    const actorName = request.fullName?.trim() || request.username?.trim() || 'Someone';

    return {
      id: `friend-request-${request.id}`,
      type: 'FRIEND_REQUEST',
      actorUserId: request.id,
      requestId: request.requestId,
      message: `${actorName} sent you a friend request.`,
      createdAt: request.requestedAt ?? new Date().toISOString(),
      isRead: false,
      avatarUrl: request.avatarUrl,
      isVirtual: true,
    };
  }, []);

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

  useEffect(() => {
    const loadSidebarData = async () => {
      const [suggestionsResult, friendPresenceResult] = await Promise.allSettled([
        friendshipService.getFriendSuggestions(),
        userService.getFriendPresence(),
      ]);

      if (suggestionsResult.status === 'fulfilled') {
        setSuggestions(suggestionsResult.value);
      } else {
        setSuggestions([]);
      }

      if (friendPresenceResult.status === 'fulfilled') {
        setOnlineUsers(friendPresenceResult.value.onlineUsers);
        setOfflineUsers(friendPresenceResult.value.offlineUsers);
        return;
      }

      const [onlineUsersResult, friendsResult] = await Promise.allSettled([
        userService.getOnlineUsers(),
        friendshipService.getFriends(),
      ]);

      const resolvedOnlineUsers =
        onlineUsersResult.status === 'fulfilled' ? onlineUsersResult.value : onlineUsersMock;
      setOnlineUsers(resolvedOnlineUsers);

      if (friendsResult.status !== 'fulfilled') {
        setOfflineUsers([]);
        return;
      }

      const onlineUserIds = new Set(resolvedOnlineUsers.map((user) => user.id));
      const resolvedOfflineUsers = friendsResult.value
        .filter((friend) => !onlineUserIds.has(friend.id))
        .map((friend) => ({
          ...friend,
          isOnline: false,
        }));

      setOfflineUsers(resolvedOfflineUsers);
    };

    void loadSidebarData();
  }, []);

  useEffect(() => {
    void loadRealtimeNotifications();

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

  const handleOpenNotification = useCallback(
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

  const handleAcceptFriendRequestNotification = useCallback(
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

  const handleRejectFriendRequestNotification = useCallback(
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

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    setNotifications((existing) => existing.map((item) => ({ ...item, isRead: true })));

    try {
      await notificationService.markAllAsRead();
    } catch {
      // Keep optimistic read state.
    }
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  const currentUser = user;

  const handleAddFriend = async (friendId: string) => {
    try {
      await friendshipService.sendFriendRequest(friendId);
    } catch {
      // Allow optimistic UI updates even when backend is unavailable in local development.
    }

    setSuggestions((existing) => existing.filter((item) => item.id !== friendId));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onOpenNotification={(item) => {
          void handleOpenNotification(item);
        }}
        onAcceptFriendRequest={(item) => handleAcceptFriendRequestNotification(item)}
        onRejectFriendRequest={(item) => handleRejectFriendRequestNotification(item)}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onLogout={logout}
      />

      <div
        className={`mx-auto grid max-w-[1600px] gap-4 px-3 pb-24 pt-20 sm:px-4 md:pb-8 lg:px-6 ${
          useSingleColumnLayout
            ? 'md:grid-cols-[minmax(0,1fr)]'
            : 'md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]'
        }`}
      >
        {useSingleColumnLayout ? null : (
          <div className="sticky top-20 hidden max-h-[calc(100vh-5.75rem)] overflow-y-auto md:block">
            <SidebarLeft currentUser={currentUser} />
          </div>
        )}

        <main className={`space-y-4 ${isProfilePage ? 'mx-auto w-full max-w-[1280px]' : ''}`}>
          <Outlet
            context={{
              currentUser,
              suggestions,
              onlineUsers,
              offlineUsers,
              notifications,
            }}
          />
        </main>

        {useSingleColumnLayout ? null : (
          <div className="sticky top-20 hidden max-h-[calc(100vh-5.75rem)] overflow-y-auto xl:block">
            <SidebarRight
              suggestions={suggestions}
              onlineUsers={onlineUsers}
              offlineUsers={offlineUsers}
              onAddFriend={handleAddFriend}
            />
          </div>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `inline-flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
          >
            <House size={18} />
            <span>{t('nav.home')}</span>
          </NavLink>
          <NavLink
            to="/friends"
            className={({ isActive }) =>
              `inline-flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
          >
            <UsersRound size={18} />
            <span>{t('nav.friends')}</span>
          </NavLink>
          <Link
            to="/profile"
            className="inline-flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            <UserRound size={18} />
            <span>{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
