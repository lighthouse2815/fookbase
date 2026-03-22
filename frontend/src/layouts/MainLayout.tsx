import { House, UserRound, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SidebarLeft } from '../components/SidebarLeft';
import { SidebarRight } from '../components/SidebarRight';
import { useAuth } from '../contexts/AuthContext';
import {
  currentUser as currentUserMock,
  friendSuggestions as friendSuggestionsMock,
  notificationPreview,
  onlineUsers as onlineUsersMock,
} from '../data/mockData';
import { friendshipService } from '../services/friendshipService';
import { userService } from '../services/userService';
import type { FriendSuggestion } from '../types/friendship';
import type { NotificationItem } from '../types/notification';
import type { User } from '../types/user';

export interface MainLayoutOutletContext {
  currentUser: User;
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  notifications: NotificationItem[];
}

export const MainLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>(friendSuggestionsMock);
  const [onlineUsers, setOnlineUsers] = useState<User[]>(onlineUsersMock);
  const [notifications] = useState<NotificationItem[]>(notificationPreview);

  const currentUser = user ?? currentUserMock;

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [apiSuggestions, apiOnlineUsers] = await Promise.all([
          friendshipService.getFriendSuggestions(),
          userService.getOnlineUsers(),
        ]);

        setSuggestions(apiSuggestions);
        setOnlineUsers(apiOnlineUsers);
      } catch {
        setSuggestions(friendSuggestionsMock);
        setOnlineUsers(onlineUsersMock);
      }
    };

    void loadSidebarData();
  }, []);

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
      <Navbar currentUser={currentUser} notifications={notifications} onLogout={logout} />

      <div className="mx-auto grid max-w-[1400px] gap-4 px-3 pb-24 pt-20 sm:px-4 md:grid-cols-[260px_minmax(0,1fr)] md:pb-8 lg:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <SidebarLeft currentUser={currentUser} />

        <main className="space-y-4">
          <Outlet
            context={{
              currentUser,
              suggestions,
              onlineUsers,
              notifications,
            }}
          />
        </main>

        <SidebarRight
          suggestions={suggestions}
          onlineUsers={onlineUsers}
          notifications={notifications}
          onAddFriend={handleAddFriend}
        />
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
