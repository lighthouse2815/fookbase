import { BookmarkX } from 'lucide-react';

import { CornerToast } from '@/components/CornerToast';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { PostCard } from '@/components/PostCard';

import { useSavedPostsPage } from './hooks/useSavedPostsPage';

export const SavedPostsPage = () => {
  const {
    t,
    currentUser,
    savedPosts,
    page,
    hasMore,
    isLoading,
    loadError,
    removingPostId,
    toast,
    showToast,
    loadSavedPosts,
    handleRemoveSavedPost,
    handlePostDeleted,
  } = useSavedPostsPage();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('savedPosts.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('savedPosts.subtitle')}</p>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      <section className="space-y-4">
        {savedPosts.length === 0 && !isLoading ? (
          <EmptyStateCard
            title={t('savedPosts.title')}
            description={t('savedPosts.empty')}
            icon={BookmarkX}
          />
        ) : null}

        {savedPosts.map((post) => (
          <div key={post.id} className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleRemoveSavedPost(post.id)}
                disabled={removingPostId === post.id}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {removingPostId === post.id ? t('savedPosts.removingButton') : t('savedPosts.removeButton')}
              </button>
            </div>
            <PostCard
              post={post}
              currentUser={currentUser}
              onActionToast={showToast}
              onPostDeleted={handlePostDeleted}
            />
          </div>
        ))}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadSavedPosts(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? t('savedPosts.loadingButton') : t('savedPosts.loadMoreButton')}
          </button>
        ) : savedPosts.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('savedPosts.noMorePosts')}</p>
        ) : null}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
