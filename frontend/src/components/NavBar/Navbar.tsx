import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Search,
  Settings,
  Sun,
  Moon,
  UserRound,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { NotificationDropdown } from '@/components/NotificationDropdown';

import type { NavbarProps } from './interface';
import { NAV_ITEMS } from './util';
import { useNavBar } from './useNavBar';

export const Navbar = (props: NavbarProps) => {
  const { currentUser } = props;
  const {
    t,
    i18n,
    theme,
    toggleTheme,
    searchKeyword,
    setSearchKeyword,
    popoverRootRef,
    setOpenPopover,
    isMenuOpen,
    isNotificationOpen,
    isLanguageOpen,
    isSettingsPage,
    isVietnameseActive,
    isEnglishActive,
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
