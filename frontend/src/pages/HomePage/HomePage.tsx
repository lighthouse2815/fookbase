import { CreatePostBox } from '@/components/CreatePostBox';
import { CornerToast } from '@/components/CornerToast';
import { PostCard } from '@/components/PostCard';
import { StoryList } from '@/components/StoryList';

import { useHomePage } from './hooks/useHomePage';

export const HomePage = () => {
  const {
    t,
    currentUser,
    feed,
    isLoading,
    isSubmitting,
    loadError,
    createError,
    hasMore,
    loadMoreSentinelRef,
    toast,
    showToast,
    handleCreatePost,
    handlePostDeleted,
    postColumnClass,
  } = useHomePage();

  return (
    <div className="space-y-4">
      <CreatePostBox currentUser={currentUser} isSubmitting={isSubmitting} onCreatePost={handleCreatePost} />
      {createError ? <p className="text-sm text-rose-600 dark:text-rose-400">{createError}</p> : null}
      <StoryList currentUser={currentUser} onActionToast={showToast} />

      <section className={`${postColumnClass} space-y-4`}>
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('home.feedTitle')}</h1>
        {loadError ? <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p> : null}
        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onActionToast={showToast}
            onPostDeleted={handlePostDeleted}
          />
        ))}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <div className="flex flex-col items-center gap-2">
            <div ref={loadMoreSentinelRef} className="h-1 w-full" aria-hidden />
            {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.noMorePosts')}</p>
        )}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
