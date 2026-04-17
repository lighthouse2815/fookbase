import { Bookmark, House, MessageSquareText, UsersRound } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { User } from '@/interface/user';

interface SidebarLeftProps {
  currentUser: User;
}

export const SidebarLeft = ({ currentUser }: SidebarLeftProps) => {
  const { t } = useTranslation();

  const menuItems = [
    { label: t('nav.home'), path: '/', icon: House },
    { label: t('nav.friends'), path: '/friends', icon: UsersRound },
    { label: t('nav.messages'), path: '/messages', icon: MessageSquareText },
    { label: t('nav.saved'), path: '/saved', icon: Bookmark },
  ];

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
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/70'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </section>
    </aside>
  );
};

