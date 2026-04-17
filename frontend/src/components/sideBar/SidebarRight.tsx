import { Moon, UserPlus, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { FriendSuggestion } from '@/interface/friendship';
import type { User } from '@/interface/user';
import { FriendCard } from '@/components/FriendCard';

interface SidebarRightProps {
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  offlineUsers: User[];
  onAddFriend?: (id: string) => void;
}

export const SidebarRight = ({
  suggestions,
  onlineUsers,
  offlineUsers,
  onAddFriend,
}: SidebarRightProps) => {
  const { t } = useTranslation();

  return (
    <aside className="hidden space-y-4 xl:block">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('sidebar.friendSuggestions')}
          </h2>
          <Link
            to="/friends?tab=suggestions"
            className="text-xs font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {t('common.viewAll')}
          </Link>
        </div>
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:border-slate-600 dark:bg-slate-700/30">
              <UserPlus className="mb-2 h-7 w-7 text-brand-500 dark:text-brand-300" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('sidebar.noSuggestions')}
              </p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <FriendCard key={suggestion.id} suggestion={suggestion} onAddFriend={onAddFriend} />
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('sidebar.onlineUsers')}
        </h2>
        {onlineUsers.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-600 dark:bg-slate-700/30">
            <Wifi className="mb-2 h-6 w-6 text-emerald-500 dark:text-emerald-300" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('sidebar.noOnlineUsers')}</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {onlineUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3">
                <Link to={`/profile/${user.id}`} className="relative inline-flex" aria-label={user.fullName}>
                  <img src={user.avatarUrl} alt={user.fullName} className="h-10 w-10 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-200">{user.fullName}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('sidebar.offlineUsers')}
        </h2>
        {offlineUsers.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-600 dark:bg-slate-700/30">
            <Moon className="mb-2 h-6 w-6 text-indigo-500 dark:text-indigo-300" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('sidebar.noOfflineUsers')}</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {offlineUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3">
                <Link to={`/profile/${user.id}`} className="relative inline-flex" aria-label={user.fullName}>
                  <img src={user.avatarUrl} alt={user.fullName} className="h-10 w-10 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-slate-400 dark:border-slate-800 dark:bg-slate-500" />
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-200">{user.fullName}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};

