import { Ban, Ellipsis, Flag, Loader2, UserMinus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { Profile } from '../types/profile';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  actionLabel?: string;
  actionButtonClassName?: string;
  onPrimaryAction?: () => void | Promise<void>;
  isPrimaryActionLoading?: boolean;
  primaryActionDisabled?: boolean;
  onUnfriend?: () => void | Promise<void>;
  onBlock?: () => void | Promise<void>;
  onReport?: () => void | Promise<void>;
  isUnfriendLoading?: boolean;
  isBlockLoading?: boolean;
  isReportLoading?: boolean;
  isUnfriendDisabled?: boolean;
}

export const ProfileHeader = ({
  profile,
  isOwnProfile = false,
  actionLabel,
  actionButtonClassName,
  onPrimaryAction,
  isPrimaryActionLoading = false,
  primaryActionDisabled = false,
  onUnfriend,
  onBlock,
  onReport,
  isUnfriendLoading = false,
  isBlockLoading = false,
  isReportLoading = false,
  isUnfriendDisabled = false,
}: ProfileHeaderProps) => {
  const { t } = useTranslation();
  const normalizedDisplayName = profile.displayName?.trim() || 'user';
  const normalizedNickname = profile.nickname?.trim();
  const visibleFriendCount = (profile.friendCountVisible ?? true) ? profile.friendsCount : 0;
  const normalizedStatus = profile.friendshipStatus?.trim().toUpperCase();
  const isFriend = normalizedStatus === 'ACCEPTED';
  const resolvedActionLabel =
    actionLabel ?? (isOwnProfile ? t('profile.editProfile') : isFriend ? t('profile.friendsButton') : t('profile.addFriend'));
  const resolvedActionButtonClass = actionButtonClassName ?? (isOwnProfile || !isFriend
    ? 'bg-brand-600 hover:bg-brand-700 text-white'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100');
  const isAnyMenuActionLoading = isUnfriendLoading || isBlockLoading || isReportLoading;

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!actionMenuRef.current || (target && actionMenuRef.current.contains(target))) {
        return;
      }

      setIsActionMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionMenuOpen]);

  const handleMenuAction = (action?: () => void | Promise<void>) => {
    if (!action || isAnyMenuActionLoading) {
      return;
    }

    setIsActionMenuOpen(false);
    void action();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      {profile.coverUrl ? (
        <img src={profile.coverUrl} alt={normalizedDisplayName} className="h-48 w-full object-cover" />
      ) : (
        <div className="h-48 bg-gradient-to-r from-brand-500 to-cyan-400" />
      )}

      <div className="relative px-6 pb-6">
        <Link to={`/profile/${profile.id}`} className="inline-flex" aria-label={normalizedDisplayName}>
          <img
            src={profile.avatarUrl}
            alt={normalizedDisplayName}
            className="-mt-12 h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-sm dark:border-slate-800"
          />
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{normalizedDisplayName}</h1>
            {normalizedNickname ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{normalizedNickname}</p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (primaryActionDisabled || isPrimaryActionLoading) {
                  return;
                }

                void onPrimaryAction?.();
              }}
              disabled={primaryActionDisabled || isPrimaryActionLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${resolvedActionButtonClass}`}
            >
              {isPrimaryActionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{resolvedActionLabel}</span>
            </button>

            {!isOwnProfile ? (
              <div ref={actionMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionMenuOpen((current) => !current)}
                  disabled={isAnyMenuActionLoading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label={t('profile.openActionsMenuAria')}
                >
                  <Ellipsis size={18} />
                </button>

                {isActionMenuOpen ? (
                  <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onUnfriend)}
                      disabled={isUnfriendDisabled || isAnyMenuActionLoading}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {isUnfriendLoading ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
                      <span>{t('profile.unfriendAction')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMenuAction(onBlock)}
                      disabled={isAnyMenuActionLoading}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-amber-300 dark:hover:bg-amber-500/10"
                    >
                      {isBlockLoading ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                      <span>{t('profile.blockUserAction')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMenuAction(onReport)}
                      disabled={isAnyMenuActionLoading}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      {isReportLoading ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
                      <span>{t('profile.reportUserAction')}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.friends')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {visibleFriendCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.posts')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.postsCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

