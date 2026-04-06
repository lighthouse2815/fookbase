import { Bell, ChevronDown, House, Languages, Menu, MessageSquareText, Moon, Sun, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const isSettingsPage = location.pathname.startsWith('/settings');

  const navItems = [
    { key: 'home', icon: House, path: '/' },
    { key: 'friends', icon: UsersRound, path: '/friends' },
    { key: 'messages', icon: MessageSquareText, path: '/messages' },
  ] as const;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    if (!location.pathname.startsWith('/friends/search')) {
      return;
    }

    const phoneNumber = new URLSearchParams(location.search).get('phoneNumber') ?? '';
    setSearchKeyword(phoneNumber);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = () => {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) {
      return;
    }

    navigate(`/friends/search?phoneNumber=${encodeURIComponent(normalizedKeyword)}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-3 sm:px-4 lg:px-6">
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
              className="hidden w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:block"
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

        <div className="relative flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsNotificationOpen((current) => !current)}
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
              onClick={() => setIsLanguageOpen((current) => !current)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Languages size={19} />
            </button>
            {isLanguageOpen ? (
              <div className="absolute right-0 top-11 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    void i18n.changeLanguage('vi');
                    setIsLanguageOpen(false);
                  }}
                  type="button"
                >
                  {t('language.vietnamese')}
                </button>
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    void i18n.changeLanguage('en');
                    setIsLanguageOpen(false);
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
              onClick={() => setIsMenuOpen((current) => !current)}
              className="hidden rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 sm:block dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Mo menu tai khoan"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <button
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 md:hidden dark:hover:bg-slate-800"
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <Menu size={19} />
          </button>

          {isNotificationOpen ? (
            <NotificationDropdown
              items={notifications}
              onOpenItem={(item) => {
                setIsNotificationOpen(false);
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
                className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Cai dat
              </Link>
              <Link
                to="/profile"
                className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Ho so
              </Link>
              <button
                type="button"
                className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

