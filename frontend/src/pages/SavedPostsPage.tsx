import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import { CornerToast } from '../components/CornerToast';
import { PostCard } from '../components/PostCard';
import { useCornerToast } from '../hooks/useCornerToast';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { savedPostService } from '../services/savedPostService';
import type { Post } from '../types/post';
import { getApiErrorMessage } from '../utils/apiError';

const PAGE_SIZE = 6;

export const SavedPostsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingPostId, setRemovingPostId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const { toast, showToast } = useCornerToast();

  const loadSavedPosts = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await savedPostService.getMine(targetPage, PAGE_SIZE);
      setSavedPosts((previous) => (replace ? response.items : [...previous, ...response.items]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, t('savedPosts.loadError')));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSavedPosts(1, true);
  }, [loadSavedPosts]);

  const handleRemoveSavedPost = async (postId: string) => {
    if (removingPostId) {
      return;
    }

    setRemovingPostId(postId);

    try {
      await savedPostService.removeSavedPost(postId);
      setSavedPosts((previous) => previous.filter((post) => post.id !== postId));
      showToast(t('savedPosts.removeSuccess'), 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, t('savedPosts.removeError')), 'error');
    } finally {
      setRemovingPostId(null);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setSavedPosts((previous) => previous.filter((post) => post.id !== postId));
  };

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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
            {t('savedPosts.empty')}
          </div>
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
