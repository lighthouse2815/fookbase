import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { UserCardProps } from '@/features/friendship/types/components';
import { useFriendAvatarNavigate } from '@/features/friendship/hooks/useFriendAvatarNavigate';

export const UserCard = ({
  user,
  variant = 'grid',
  selected = false,
  statusText,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onSelect,
}: UserCardProps) => {
  const { t } = useTranslation();
  const navigateToProfile = useFriendAvatarNavigate();

  return (
    <article
      className={clsx(
        'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-900/75',
        selected
          ? 'border-brand-400 shadow-brand-500/20 dark:border-brand-500'
          : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/60',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        data-profile-preview-trigger="true"
        className={clsx(
          'flex w-full text-left',
          variant === 'grid' ? 'flex-col' : 'items-start gap-3 p-3 sm:items-center sm:gap-4 sm:p-4',
        )}
      >
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          onClick={navigateToProfile(user.id)}
          className={clsx(
            'cursor-pointer object-cover',
            variant === 'grid' ? 'h-36 w-full sm:h-40' : 'h-14 w-14 rounded-full sm:h-16 sm:w-16',
          )}
        />

        <div className={clsx('min-w-0', variant === 'grid' ? 'p-3' : 'flex-1')}>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {t('friendsPage.mutualFriends', { count: user.mutualFriends })}
          </p>
          {statusText ? <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">{statusText}</p> : null}
        </div>
      </button>

      <div className={clsx('space-y-2', variant === 'grid' ? 'px-3 pb-3' : 'px-3 pb-3 sm:px-4 sm:pb-4')}>
        {primaryActionLabel ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {primaryActionLabel}
          </button>
        ) : null}
        {secondaryActionLabel ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        <Link
          to={`/profile/${user.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 sm:w-auto sm:border-none sm:px-0 sm:py-0 sm:text-xs"
        >
          {t('friendsPage.actions.viewProfile')}
        </Link>
      </div>
    </article>
  );
};
