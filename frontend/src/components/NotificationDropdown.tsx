import { useTranslation } from 'react-i18next';

import type { NotificationItem } from '../types/notification';
import { formatRelativeTime } from '../utils/date';

interface NotificationDropdownProps {
  items: NotificationItem[];
}

export const NotificationDropdown = ({ items }: NotificationDropdownProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
      <h3 className="px-2 py-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('notifications.title')}
      </h3>

      {items.length === 0 ? (
        <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">{t('notifications.empty')}</p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl px-3 py-2 text-sm ${
                item.isRead
                  ? 'bg-transparent text-slate-600 dark:text-slate-300'
                  : 'bg-brand-50 text-slate-700 dark:bg-brand-900/20 dark:text-slate-100'
              }`}
            >
              <p>{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

