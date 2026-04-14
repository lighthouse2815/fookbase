import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { Profile } from '../types/profile';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
}

export const ProfileHeader = ({ profile, isOwnProfile = false }: ProfileHeaderProps) => {
  const { t } = useTranslation();
  const normalizedDisplayName = profile.displayName?.trim() || 'user';
  const normalizedNickname = profile.nickname?.trim();
  const visibleFriendCount = (profile.friendCountVisible ?? true) ? profile.friendsCount : 0;
  const normalizedStatus = profile.friendshipStatus?.trim().toUpperCase();
  const isFriend = normalizedStatus === 'ACCEPTED';
  const actionLabel = isOwnProfile ? t('profile.editProfile') : isFriend ? t('profile.friendsButton') : t('profile.addFriend');
  const actionButtonClass = isOwnProfile || !isFriend
    ? 'bg-brand-600 hover:bg-brand-700 text-white'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100';

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
          <button className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${actionButtonClass}`}>
            {actionLabel}
          </button>
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

