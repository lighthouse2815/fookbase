import { Ban, Loader2, RefreshCw, ShieldAlert, Unlock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BlockedUser } from '@/interface/friendship';
import { friendshipService } from '@/services/friendship/friendshipService';
import { getApiErrorMessage } from '@/utils/apiError';

export const BlockedUsersSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  const formatBlockedAt = (value?: string): string | null => {
    if (!value) {
      return null;
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return value;
    }

    return dateFormatter.format(new Date(timestamp));
  };

  const loadBlockedUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const users = await friendshipService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      setBlockedUsers([]);
      setErrorMessage(getApiErrorMessage(error, t('blockedUsersSettings.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = async (targetUserId: string) => {
    if (unblockingUserId) {
      return;
    }

    setUnblockingUserId(targetUserId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.unblockUser(targetUserId);
      setBlockedUsers((previous) => previous.filter((user) => user.id !== targetUserId));
      setActionMessage(t('blockedUsersSettings.unblockSuccess'));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('blockedUsersSettings.unblockError')));
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
            <Ban size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('blockedUsersSettings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('blockedUsersSettings.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {actionMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {actionMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void loadBlockedUsers()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/20"
          >
            <RefreshCw size={15} />
            <span>{t('blockedUsersSettings.retry')}</span>
          </button>
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500 dark:text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {t('blockedUsersSettings.loading')}
          </p>
        </section>
      ) : blockedUsers.length === 0 && !errorMessage ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ShieldAlert size={24} />
          </div>
          <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('blockedUsersSettings.emptyTitle')}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('blockedUsersSettings.emptySubtitle')}
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {blockedUsers.map((user) => {
            const blockedAt = formatBlockedAt(user.blockedAt);
            const isUnblocking = unblockingUserId === user.id;

            return (
              <article
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    {blockedAt ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('blockedUsersSettings.blockedAt', { date: blockedAt })}
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleUnblock(user.id)}
                  disabled={Boolean(unblockingUserId)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {isUnblocking ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
                  <span>{isUnblocking ? t('blockedUsersSettings.unblocking') : t('blockedUsersSettings.unblock')}</span>
                </button>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
