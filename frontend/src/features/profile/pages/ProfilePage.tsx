import { Ban } from 'lucide-react';

import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { CreatePostBox } from '@/features/post/components/CreatePostBox';
import { PostCard } from '@/features/post/components/PostCard';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';

import { useProfilePage } from '@/features/profile/hooks/useProfilePage';

export const ProfilePage = () => {
  const {
    t,
    currentUser,
    isOwnProfile,
    profile,
    personalPosts,
    isSubmittingPost,
    createPostError,
    toast,
    showToast,
    isPrimaryActionLoading,
    menuActionLoading,
    primaryActionMeta,
    friendshipStatus,
    infoItems,
    handleCreatePost,
    handlePostDeleted,
    handlePrimaryAction,
    handleCancelSentRequest,
    handleUnfriend,
    handleBlockUser,
    handleReportUser,
    postColumnClass,
  } = useProfilePage();
  const isBannedProfile = !isOwnProfile && profile.userStatus?.trim().toUpperCase() === 'BANNED';

  if (isBannedProfile) {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100 p-10 text-center shadow-sm dark:border-red-500/30 dark:from-red-950/40 dark:via-slate-900 dark:to-red-900/30">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
            <Ban size={28} />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-red-600 dark:text-red-300 sm:text-4xl">
            {t('profile.bannedUserTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold text-red-500 dark:text-red-200 sm:text-lg">
            {t('profile.bannedUserDescription')}
          </p>
        </section>

        <CornerToast message={toast?.message ?? null} type={toast?.type} />
      </div>
    );
  }

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
    <div className="w-full min-w-0 space-y-4">
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

      <div className="grid w-full min-w-0 gap-3 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]">
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

        <section className={`${postColumnClass} min-w-0 space-y-4`}>
          {isOwnProfile ? (
            <>
              <CreatePostBox
                currentUser={currentUser}
                isSubmitting={isSubmittingPost}
                onCreatePost={handleCreatePost}
              />
              {createPostError ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{createPostError}</p>
              ) : null}
            </>
          ) : null}

          {personalPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              enableMediaViewer
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


