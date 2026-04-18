import { CornerToast } from '@/components/CornerToast';
import { PostCard } from '@/components/PostCard';

import { usePostDetailPage } from './hooks/usePostDetailPage';

export const PostDetailPage = () => {
  const { currentUser, post, isLoading, errorMessage, toast, showToast, handlePostDeleted } = usePostDetailPage();

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        Loading post...
      </section>
    );
  }

  if (errorMessage || !post) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600 shadow-sm dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
        {errorMessage ?? 'Post not found.'}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Post Notification</p>
      </section>

      <PostCard post={post} currentUser={currentUser} onActionToast={showToast} onPostDeleted={handlePostDeleted} />
      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
