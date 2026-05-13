import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  Star,
  UserRound,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { NotificationDropdown } from '@/app/layouts/components/navbar/NotificationDropdown';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

import type { NavbarProps } from './interface';
import { NAV_ITEMS } from './util';
import { useNavBar } from './useNavBar';

export const Navbar = (props: NavbarProps) => {
  const { currentUser, hasUnreadMessages, hasPendingFriendRequests } = props;
  const tx = useLocaleText();
  const {
    t,
    searchKeyword,
    setSearchKeyword,
    popoverRootRef,
    setOpenPopover,
    isMenuOpen,
    isNotificationOpen,
    isSettingsPage,
    unreadCount,
    handleSearchSubmit,
    togglePopover,
    notifications,
    onOpenNotification,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onMarkAllNotificationsAsRead,
    onLogout,
  } = useNavBar(props);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mx-auto max-w-[1360px] px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition hover:opacity-90 dark:border-slate-700 dark:bg-slate-900"
            >
              <img src="/logo.png" alt={t('app.name')} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
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
                className="hidden w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:block xl:w-52"
              />
            ) : null}
          </div>

          <nav className="hidden items-center gap-1.5 md:flex">
            {NAV_ITEMS.map(({ key, icon: Icon, path }) => (
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
                <span className="relative inline-flex">
                  <Icon size={20} />
                  {(key === 'messages' && hasUnreadMessages) || (key === 'friends' && hasPendingFriendRequests) ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div ref={popoverRootRef} className="relative flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePopover('notification')}
              className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title={t('nav.notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              ) : null}
            </button>

            <div className="flex items-center gap-1 rounded-2xl px-1 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <Link to="/profile" className="inline-flex rounded-full" aria-label={currentUser.fullName}>
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
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
              className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 md:hidden dark:hover:bg-slate-800"
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
              <div className="absolute right-0 top-11 z-30 w-[min(18rem,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-900">
                <Link
                  to="/reviews"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setOpenPopover(null)}
                >
                  <Star size={16} />
                  {tx('Đánh giá ứng dụng', 'App reviews')}
                </Link>
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
          <div className="pb-2.5 md:hidden">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-11 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl p-1.5 text-slate-600 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
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


