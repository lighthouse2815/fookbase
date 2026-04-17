import { CornerToast } from '@/components/CornerToast';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/ProfileHeader';

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
    handleUnfriend,
    handleBlockUser,
    handleReportUser,
    postColumnClass,
  } = useProfilePage();

  return (
    <div className="space-y-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        actionLabel={primaryActionMeta.label}
        actionButtonClassName={primaryActionMeta.buttonClassName}
        onPrimaryAction={handlePrimaryAction}
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
