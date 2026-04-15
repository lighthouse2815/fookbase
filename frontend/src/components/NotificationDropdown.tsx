import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { NotificationItem } from '../types/notification';
import { formatRelativeTime } from '../utils/date';

interface NotificationDropdownProps {
  items: NotificationItem[];
  onOpenItem: (item: NotificationItem) => void;
  onAcceptFriendRequest: (item: NotificationItem) => Promise<void>;
  onRejectFriendRequest: (item: NotificationItem) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const NotificationDropdown = ({
  items,
  onOpenItem,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onMarkAllAsRead,
}: NotificationDropdownProps) => {
  const { t } = useTranslation();
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'accept' | 'reject' | 'readall' | null>(null);

  const handleAccept = async (item: NotificationItem) => {
    setActiveNotificationId(item.id);
    setActiveAction('accept');

    try {
      await onAcceptFriendRequest(item);
    } finally {
      setActiveNotificationId(null);
      setActiveAction(null);
    }
  };

  const handleReject = async (item: NotificationItem) => {
    setActiveNotificationId(item.id);
    setActiveAction('reject');

    try {
      await onRejectFriendRequest(item);
    } finally {
      setActiveNotificationId(null);
      setActiveAction(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActiveAction('readall');

    try {
      await onMarkAllAsRead();
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('notifications.title')}</h3>
        <button
          type="button"
          onClick={() => void handleMarkAllAsRead()}
          disabled={activeAction === 'readall' || items.length === 0}
          className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-300 dark:hover:text-brand-200"
        >
          {activeAction === 'readall' ? t('notifications.markingAll') : t('notifications.markAll')}
        </button>
      </div>

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
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="w-full text-left"
              >
                <p>{item.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</p>
              </button>

              {(item.type ?? '').toUpperCase() === 'FRIEND_REQUEST' ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleAccept(item);
                    }}
                    disabled={activeNotificationId === item.id}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={13} />
                  {activeNotificationId === item.id && activeAction === 'accept'
                    ? t('notifications.processing')
                    : t('notifications.accept')}
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleReject(item);
                    }}
                    disabled={activeNotificationId === item.id}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={13} />
                  {activeNotificationId === item.id && activeAction === 'reject'
                    ? t('notifications.processing')
                    : t('notifications.reject')}
                </button>
              </div>
            ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

