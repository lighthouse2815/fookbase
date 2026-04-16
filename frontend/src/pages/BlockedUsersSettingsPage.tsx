import { Ban, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CornerToast } from '../components/CornerToast';
import { useCornerToast } from '../hooks/useCornerToast';
import { friendshipService } from '../services/friendshipService';
import type { BlockedUser } from '../types/friendship';
import { getApiErrorMessage } from '../utils/apiError';

export const BlockedUsersSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast, showToast } = useCornerToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const blockedDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  const loadBlockedUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await friendshipService.getBlockedUsers();
      setBlockedUsers(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('blockedUsersSettings.loadError')));
      setBlockedUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBlockedUsers();
  }, []);

  const handleUnblock = async (user: BlockedUser) => {
    if (loadingUserId) {
      return;
    }

    setLoadingUserId(user.id);

    try {
      await friendshipService.unblockUser(user.id);
      setBlockedUsers((previous) => previous.filter((item) => item.id !== user.id));
      showToast(t('blockedUsersSettings.unblockSuccess'), 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, t('blockedUsersSettings.unblockError')), 'error');
    } finally {
      setLoadingUserId(null);
    }
  };

  const formatBlockedAt = (value?: string) => {
    if (!value) {
      return null;
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return value;
    }

    return blockedDateFormatter.format(new Date(timestamp));
  };

  return (
    <div className="space-y-4 pb-4">
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

      {isLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('blockedUsersSettings.loading')}</p>
        </section>
      ) : null}

      {!isLoading && errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10">
          <p className="text-sm text-rose-700 dark:text-rose-200">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              void loadBlockedUsers();
            }}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            {t('blockedUsersSettings.retry')}
          </button>
        </section>
      ) : null}

      {!isLoading && !errorMessage && blockedUsers.length === 0 ? (
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
      ) : null}

      {!isLoading && !errorMessage && blockedUsers.length > 0 ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          {blockedUsers.map((user) => {
            const blockedAtLabel = formatBlockedAt(user.blockedAt);

            return (
              <article
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 md:flex-row md:items-center md:justify-between"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-3 text-left transition hover:opacity-90"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-12 w-12 rounded-full border border-white/80 object-cover shadow-sm dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    {blockedAtLabel ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('blockedUsersSettings.blockedAt', { date: blockedAtLabel })}
                      </p>
                    ) : null}
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {t('blockedUsersSettings.viewProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleUnblock(user);
                    }}
                    disabled={loadingUserId === user.id}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingUserId === user.id ? t('blockedUsersSettings.unblocking') : t('blockedUsersSettings.unblock')}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
