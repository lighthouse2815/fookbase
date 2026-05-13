import { Star } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { User } from '@/features/user/types/contracts';
import { NAV_ITEMS } from '@/app/layouts/components/navbar/util';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface SidebarLeftProps {
  currentUser: User;
  hasUnreadMessages: boolean;
  hasPendingFriendRequests: boolean;
}

export const SidebarLeft = ({
  currentUser,
  hasUnreadMessages,
  hasPendingFriendRequests,
}: SidebarLeftProps) => {
  const { t } = useTranslation();
  const tx = useLocaleText();

  return (
    <aside className="hidden space-y-4 md:block">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="inline-flex" aria-label={currentUser.fullName}>
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="h-12 w-12 rounded-full object-cover"
            />
          </Link>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser.fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{currentUser.username}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        {NAV_ITEMS.map(({ key, path, icon: Icon }) => (
          <NavLink
            key={key}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/70'
              }`
            }
          >
            <span className="relative inline-flex">
              <Icon size={17} />
              {(key === 'messages' && hasUnreadMessages) || (key === 'friends' && hasPendingFriendRequests) ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              ) : null}
            </span>
            {t(`nav.${key}`)}
          </NavLink>
        ))}

        <NavLink
          to="/reviews"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/70'
            }`
          }
        >
          <Star size={17} />
          {tx('Đánh giá', 'Reviews')}
        </NavLink>
      </section>
    </aside>
  );
};
