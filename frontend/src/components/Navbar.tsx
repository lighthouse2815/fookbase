import {
  Bell,
  Bookmark,
  ChevronDown,
  House,
  Languages,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import type { NotificationItem } from '../types/notification';
import type { User } from '../types/user';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  currentUser: User;
  notifications: NotificationItem[];
  onOpenNotification: (item: NotificationItem) => void;
  onAcceptFriendRequest: (item: NotificationItem) => Promise<void>;
  onRejectFriendRequest: (item: NotificationItem) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
  onLogout: () => void;
}

type NavbarPopover = 'menu' | 'notification' | 'language' | null;

export const Navbar = ({
  currentUser,
  notifications,
  onOpenNotification,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onMarkAllNotificationsAsRead,
  onLogout,
}: NavbarProps) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openPopover, setOpenPopover] = useState<NavbarPopover>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const popoverRootRef = useRef<HTMLDivElement | null>(null);
  const isMenuOpen = openPopover === 'menu';
  const isNotificationOpen = openPopover === 'notification';
  const isLanguageOpen = openPopover === 'language';
  const isSettingsPage = location.pathname.startsWith('/settings');
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const isVietnameseActive = currentLanguage.startsWith('vi');
  const isEnglishActive = currentLanguage.startsWith('en');

  const navItems = [
    { key: 'home', icon: House, path: '/' },
    { key: 'friends', icon: UsersRound, path: '/friends' },
    { key: 'messages', icon: MessageSquareText, path: '/messages' },
    { key: 'saved', icon: Bookmark, path: '/saved' },
  ] as const;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    if (!location.pathname.startsWith('/friends/search')) {
      return;
    }

    const phoneNumber = new URLSearchParams(location.search).get('phoneNumber') ?? '';
    const frameId = window.requestAnimationFrame(() => {
      setSearchKeyword(phoneNumber);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!openPopover) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!popoverRootRef.current || (target && popoverRootRef.current.contains(target))) {
        return;
      }

      setOpenPopover(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPopover(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openPopover]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setOpenPopover(null);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.search]);

  const handleSearchSubmit = () => {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) {
      return;
    }

    navigate(`/friends/search?phoneNumber=${encodeURIComponent(normalizedKeyword)}`);
  };

  const togglePopover = (popover: Exclude<NavbarPopover, null>) => {
    setOpenPopover((current) => (current === popover ? null : popover));
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="rounded-lg bg-brand-600 px-3 py-1.5 text-lg font-bold text-white">
              IH
            </Link>
            <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 lg:block">
              {t('app.name')}
            </span>
            {!isSettingsPage ? (
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={t('nav.searchPlaceholder')}
                className="hidden w-52 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:block"
              />
            ) : null}
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ key, icon: Icon, path }) => (
              <NavLink
                key={key}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 transition ${
                    isActive
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
                title={t(`nav.${key}`)}
              >
                <Icon size={20} />
              </NavLink>
            ))}
          </nav>

          <div ref={popoverRootRef} className="relative flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePopover('notification')}
              className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title={t('nav.notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={t('theme.switch')}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover('language')}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Languages size={19} />
              </button>
              {isLanguageOpen ? (
                <div className="absolute right-0 top-11 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      isVietnameseActive
                        ? 'bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      void i18n.changeLanguage('vi');
                      setOpenPopover(null);
                    }}
                    type="button"
                  >
                    {t('language.vietnamese')}
                  </button>
                  <button
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      isEnglishActive
                        ? 'bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      void i18n.changeLanguage('en');
                      setOpenPopover(null);
                    }}
                    type="button"
                  >
                    {t('language.english')}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1 rounded-xl px-1 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <Link to="/profile" className="inline-flex rounded-full" aria-label={currentUser.fullName}>
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              </Link>
              <button
                type="button"
                onClick={() => togglePopover('menu')}
                className="hidden rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 sm:block dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={t('nav.accountMenu')}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 md:hidden dark:hover:bg-slate-800"
              type="button"
              onClick={() => togglePopover('menu')}
            >
              <Menu size={19} />
            </button>

            {isNotificationOpen ? (
              <NotificationDropdown
                items={notifications}
                onOpenItem={(item) => {
                  setOpenPopover(null);
                  onOpenNotification(item);
                }}
                onAcceptFriendRequest={onAcceptFriendRequest}
                onRejectFriendRequest={onRejectFriendRequest}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
              />
            ) : null}

            {isMenuOpen ? (
              <div className="absolute right-0 top-12 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-900">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setOpenPopover(null)}
                >
                  <Settings size={16} />
                  {t('nav.settings')}
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setOpenPopover(null)}
                >
                  <UserRound size={16} />
                  {t('nav.profile')}
                </Link>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => {
                    onLogout();
                    setOpenPopover(null);
                  }}
                >
                  <LogOut size={16} />
                  {t('nav.logout')}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {!isSettingsPage ? (
          <div className="pb-3 md:hidden">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-11 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={t('nav.searchPlaceholder')}
              >
                <Search size={16} />
              </button>
            </label>
          </div>
        ) : null}
      </div>
    </header>
  );
};

