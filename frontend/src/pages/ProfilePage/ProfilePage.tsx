import { Ban } from 'lucide-react';

import { CornerToast } from '@/components/CornerToast';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/header/ProfileHeader';

import { useProfilePage } from './hooks/useProfilePage';

export const ProfilePage = () => {
  const {
    t,
    currentUser,
    isOwnProfile,
    profile,
    personalPosts,
    toast,
    showToast,
    isPrimaryActionLoading,
    menuActionLoading,
    primaryActionMeta,
    friendshipStatus,
    infoItems,
    handlePostDeleted,
    handlePrimaryAction,
    handleCancelSentRequest,
    handleUnfriend,
    handleBlockUser,
    handleReportUser,
    postColumnClass,
  } = useProfilePage();

  if (!isOwnProfile && friendshipStatus === 'BLOCKED') {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
            <Ban size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('profile.blockedUserTitle')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('profile.blockedUserDescription')}
          </p>
        </section>

        <CornerToast message={toast?.message ?? null} type={toast?.type} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        actionLabel={primaryActionMeta.label}
        actionButtonClassName={primaryActionMeta.buttonClassName}
        onPrimaryAction={handlePrimaryAction}
        onCancelRequest={handleCancelSentRequest}
        isPrimaryActionLoading={isPrimaryActionLoading}
        primaryActionDisabled={primaryActionMeta.disabled}
        onUnfriend={handleUnfriend}
        onBlock={handleBlockUser}
        onReport={handleReportUser}
        isUnfriendLoading={menuActionLoading === 'unfriend'}
        isBlockLoading={menuActionLoading === 'block'}
        isReportLoading={menuActionLoading === 'report'}
        isUnfriendDisabled={friendshipStatus !== 'ACCEPTED'}
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('profile.personalInfo')}</h2>

            <dl className="mt-3 space-y-3">
              {infoItems.map((item) => (
                <div key={item.key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>

        <section className={`${postColumnClass} space-y-4`}>
          {personalPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onActionToast={showToast}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </section>
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
