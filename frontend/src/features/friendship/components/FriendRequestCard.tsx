import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { FriendRequestCardProps } from '@/features/friendship/types/components';
import { useFriendAvatarNavigate } from '@/features/friendship/hooks/useFriendAvatarNavigate';
import { formatFriendRequestTime } from '@/features/friendship/utils/component.util';

export const FriendRequestCard = ({
  request,
  mode,
  selected = false,
  onSelect,
  onConfirm,
  onDelete,
  onCancel,
}: FriendRequestCardProps) => {
  const { t } = useTranslation();
  const navigateToProfile = useFriendAvatarNavigate();

  return (
    <article
      className={clsx(
        'rounded-2xl border bg-white p-4 shadow-sm transition-all dark:bg-slate-900/75',
        selected
          ? 'border-brand-400 shadow-brand-500/20 dark:border-brand-500'
          : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/60',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        data-profile-preview-trigger="true"
        className="group mb-3 flex w-full items-start gap-3 text-left sm:items-center"
      >
        <img
          src={request.avatarUrl}
          alt={request.fullName}
          onClick={navigateToProfile(request.id)}
          className="h-14 w-14 cursor-pointer rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{request.fullName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {t('friendsPage.mutualFriends', { count: request.mutualFriends })}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {formatFriendRequestTime(request.requestedAt, t)}
          </p>
        </div>
      </button>

      {mode === 'received' ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t('friendsPage.actions.confirm')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('friendsPage.actions.delete')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t('friendsPage.requestStatus.sent')}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('friendsPage.actions.cancel')}
          </button>
        </div>
      )}

      <Link
        to={`/profile/${request.id}`}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 sm:w-auto sm:border-none sm:px-0 sm:py-0 sm:text-xs"
      >
        {t('friendsPage.actions.viewProfile')}
      </Link>
    </article>
  );
};
