import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import type { FriendSuggestion, FriendUser } from '@/interface/friendship';

type UserCardVariant = 'grid' | 'list';

interface UserCardProps {
  user: FriendSuggestion | FriendUser;
  variant?: UserCardVariant;
  selected?: boolean;
  statusText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onSelect?: () => void;
}

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
  const navigate = useNavigate();

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
        className={clsx(
          'flex w-full text-left',
          variant === 'grid' ? 'flex-col' : 'items-center gap-3 p-3 sm:gap-4 sm:p-4',
        )}
      >
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          onClick={(event) => {
            event.stopPropagation();
            void navigate(`/profile/${user.id}`);
          }}
          className={clsx(
            'cursor-pointer object-cover',
            variant === 'grid' ? 'h-40 w-full' : 'h-14 w-14 rounded-full sm:h-16 sm:w-16',
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
          className="inline-flex text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
        >
          {t('friendsPage.actions.viewProfile')}
        </Link>
      </div>
    </article>
  );
};
