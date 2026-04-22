import { Languages, LogOut, Menu, Moon, Shield, Sun, UserCircle2 } from 'lucide-react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocaleText } from '@/shared/i18n/useLocaleText';
import type { User } from '@/features/user/types/contracts';
import type { AdminPopover } from '@/features/admin/hooks/useAdminLayout';

interface AdminHeaderProps {
  user: User | null;
  resolvedTheme: 'light' | 'dark';
  openPopover: AdminPopover;
  popoverRootRef: RefObject<HTMLDivElement>;
  isVietnameseActive: boolean;
  isEnglishActive: boolean;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onTogglePopover: (popover: Exclude<AdminPopover, null>) => void;
  onChangeLanguage: (language: 'vi' | 'en') => Promise<void>;
  onClosePopover: () => void;
  onLogout: () => void;
}

const DEFAULT_ADMIN_AVATAR_URL =
  'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

export const AdminHeader = ({
  user,
  resolvedTheme,
  openPopover,
  popoverRootRef,
  isVietnameseActive,
  isEnglishActive,
  onToggleSidebar,
  onToggleTheme,
  onTogglePopover,
  onChangeLanguage,
  onClosePopover,
  onLogout,
}: AdminHeaderProps) => {
  const { t } = useTranslation();
  const tx = useLocaleText();

  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu size={18} />
          </button>

          <div className="rounded-xl bg-brand-600 p-2 text-white">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-5">{tx('Bang dieu khien admin', 'Admin Console')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.username ?? 'admin'}</p>
          </div>
        </div>

        <div ref={popoverRootRef} className="relative flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            title={t('theme.switch')}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => onTogglePopover('language')}
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
                    void onChangeLanguage('vi');
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
                    void onChangeLanguage('en');
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
              onClick={() => onTogglePopover('profile')}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <img
                src={user?.avatarUrl || DEFAULT_ADMIN_AVATAR_URL}
                alt={user?.fullName || user?.username || 'admin'}
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>

            {openPopover === 'profile' ? (
              <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-900">
                <Link
                  to="/admin/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={onClosePopover}
                >
                  <UserCircle2 size={16} />
                  {tx('Ho so admin', 'Admin profile')}
                </Link>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => {
                    onLogout();
                    onClosePopover();
                  }}
                >
                  <LogOut size={16} />
                  {tx('Dang xuat', 'Logout')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};


