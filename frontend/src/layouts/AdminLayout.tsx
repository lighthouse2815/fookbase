import {
  BarChart3,
  BellRing,
  FileWarning,
  Flag,
  Languages,
  LogOut,
  Menu,
  MessageSquareWarning,
  Moon,
  Shield,
  Sun,
  UserCircle2,
  UserCog,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocaleText } from '@/hooks/useLocaleText';

type AdminPopover = 'language' | 'profile' | null;

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export const AdminLayout = () => {
  const { t, i18n } = useTranslation();
  const tx = useLocaleText();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const [openPopover, setOpenPopover] = useState<AdminPopover>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const popoverRootRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const isVietnameseActive = currentLanguage.startsWith('vi');
  const isEnglishActive = currentLanguage.startsWith('en');

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

  const togglePopover = (popover: Exclude<AdminPopover, null>) => {
    setOpenPopover((current) => (current === popover ? null : popover));
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const sideNav = (
    <nav className="space-y-1">
      <NavLink to="/admin/dashboard" className={navLinkClassName} onClick={closeSidebar}>
        <BarChart3 size={16} />
        {tx('Tổng quan', 'Dashboard')}
      </NavLink>
      <NavLink to="/admin/users" className={navLinkClassName} onClick={closeSidebar}>
        <UserCog size={16} />
        {tx('Quản lý người dùng', 'User management')}
      </NavLink>
      <NavLink to="/admin/reports/posts" className={navLinkClassName} onClick={closeSidebar}>
        <FileWarning size={16} />
        {tx('Báo cáo bài đăng', 'Post reports')}
      </NavLink>
      <NavLink to="/admin/reports/users" className={navLinkClassName} onClick={closeSidebar}>
        <Flag size={16} />
        {tx('Báo cáo người dùng', 'User reports')}
      </NavLink>
      <NavLink to="/admin/reports/comments" className={navLinkClassName} onClick={closeSidebar}>
        <MessageSquareWarning size={16} />
        {tx('Báo cáo bình luận', 'Comment reports')}
      </NavLink>
      <NavLink to="/admin/reports/stories" className={navLinkClassName} onClick={closeSidebar}>
        <BellRing size={16} />
        {tx('Báo cáo story', 'Story reports')}
      </NavLink>
      <NavLink to="/admin/audit-logs" className={navLinkClassName} onClick={closeSidebar}>
        <Shield size={16} />
        {tx('Lịch sử duyệt', 'Audit logs')}
      </NavLink>
      <NavLink to="/admin/profile" className={navLinkClassName} onClick={closeSidebar}>
        <UserCircle2 size={16} />
        {tx('Hồ sơ admin', 'Admin profile')}
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((value) => !value)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu size={18} />
            </button>

            <div className="rounded-xl bg-brand-600 p-2 text-white">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">{tx('Bảng điều khiển admin', 'Admin Console')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.username ?? 'admin'}</p>
            </div>
          </div>

          <div ref={popoverRootRef} className="relative flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={t('theme.switch')}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover('language')}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Languages size={18} />
              </button>
              {openPopover === 'language' ? (
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

            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover('profile')}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id ?? 'admin'}`}
                  alt={user?.fullName || user?.username || 'admin'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              </button>

              {openPopover === 'profile' ? (
                <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <Link
                    to="/admin/profile"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setOpenPopover(null)}
                  >
                    <UserCircle2 size={16} />
                    {tx('Hồ sơ admin', 'Admin profile')}
                  </Link>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    onClick={() => {
                      logout();
                      setOpenPopover(null);
                    }}
                  >
                    <LogOut size={16} />
                    {tx('Đăng xuất', 'Logout')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/65" onClick={closeSidebar} />
          <aside className="relative h-full w-[280px] overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {sideNav}
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 pb-8 pt-4 sm:px-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:sticky md:top-4 md:block md:h-fit">
          {sideNav}
        </aside>

        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
