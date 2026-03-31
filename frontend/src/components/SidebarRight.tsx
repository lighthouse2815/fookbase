import { useTranslation } from 'react-i18next';

import type { FriendSuggestion } from '../types/friendship';
import type { NotificationItem } from '../types/notification';
import type { User } from '../types/user';
import { formatRelativeTime } from '../utils/date';
import { FriendCard } from './FriendCard';

interface SidebarRightProps {
  suggestions: FriendSuggestion[];
  onlineUsers: User[];
  notifications: NotificationItem[];
  onAddFriend?: (id: string) => void;
  onOpenNotification?: (item: NotificationItem) => void;
}

export const SidebarRight = ({
  suggestions,
  onlineUsers,
  notifications,
  onAddFriend,
  onOpenNotification,
}: SidebarRightProps) => {
  const { t } = useTranslation();

  return (
    <aside className="hidden space-y-4 xl:block">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('sidebar.friendSuggestions')}
          </h2>
          <button className="text-xs font-medium text-brand-600 dark:text-brand-300">{t('common.viewAll')}</button>
        </div>
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <FriendCard key={suggestion.id} suggestion={suggestion} onAddFriend={onAddFriend} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('sidebar.onlineUsers')}
        </h2>
        <ul className="mt-3 space-y-2">
          {onlineUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatarUrl} alt={user.fullName} className="h-10 w-10 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{user.fullName}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('sidebar.notificationsPreview')}
        </h2>
        <ul className="mt-3 space-y-2">
          {notifications.slice(0, 3).map((item) => (
            <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-700/40">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onOpenNotification?.(item)}
              >
                <p className="text-sm text-slate-700 dark:text-slate-200">{item.message}</p>
                <p className="text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
};

