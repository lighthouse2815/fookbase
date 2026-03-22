import { useTranslation } from 'react-i18next';

import type { Profile } from '../types/profile';

interface ProfileHeaderProps {
  profile: Profile;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      {profile.coverUrl ? (
        <img src={profile.coverUrl} alt={profile.fullName} className="h-48 w-full object-cover" />
      ) : (
        <div className="h-48 bg-gradient-to-r from-brand-500 to-cyan-400" />
      )}

      <div className="relative px-6 pb-6">
        <img
          src={profile.avatarUrl}
          alt={profile.fullName}
          className="-mt-12 h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-sm dark:border-slate-800"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.fullName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>
          </div>
          <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            {t('profile.editProfile')}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.major')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.major}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.year')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.year}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.friends')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile.friendsCount}
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

