import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { NotificationItem } from '@/features/notification/types/contracts';
import { formatNotificationPresentation } from '@/features/notification/utils/notificationFormatter';
import { formatRelativeTime } from '@/shared/lib/date';

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
  const { t, i18n } = useTranslation();
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
    <div className="absolute right-0 top-12 z-30 w-[min(24rem,calc(100vw-1rem))] max-h-[min(70vh,32rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
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
        <ul className="max-h-[min(55vh,20rem)] overflow-auto rounded-xl border border-slate-100 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800">
          {items.map((item) => {
            const presentation = formatNotificationPresentation(
              item,
              t,
              i18n.resolvedLanguage ?? i18n.language,
            );

            return (
              <li
                key={item.id}
                className={`px-3 py-3 text-sm transition-colors ${
                  item.isRead
                    ? 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                    : 'bg-brand-50/80 text-slate-700 dark:bg-brand-500/10 dark:text-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={presentation.avatarUrl}
                      alt={presentation.actorName}
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                    />
                    <div className="min-w-0">
                      <p className="break-words text-[13.5px] leading-5">
                        {presentation.highlightActor ? (
                          <>
                            <span className="font-semibold text-brand-700 dark:text-brand-300">
                              {presentation.actorName}
                            </span>{' '}
                            <span className="text-slate-700 dark:text-slate-200">{presentation.messageText}</span>
                          </>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-200">{presentation.messageText}</span>
                        )}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                </button>

                {(item.type ?? '').toUpperCase() === 'FRIEND_REQUEST' ? (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 pl-12">
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
            );
          })}
        </ul>
      )}
    </div>
  );
};

