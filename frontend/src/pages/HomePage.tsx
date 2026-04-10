import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import { CreatePostBox } from '../components/CreatePostBox';
import type { CreatePostDraft } from '../components/CreatePostBox';
import { CornerToast } from '../components/CornerToast';
import { PostCard } from '../components/PostCard';
import { StoryList } from '../components/StoryList';
import { useCornerToast } from '../hooks/useCornerToast';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { cloudinaryService } from '../services/cloudinaryService';
import { postService } from '../services/postService';
import type { Post } from '../types/post';
import { getApiErrorMessage } from '../utils/apiError';

const PAGE_SIZE = 2;
const POST_COLUMN_CLASS = 'mx-auto w-full max-w-[980px]';

export const HomePage = () => {
  const { t } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();

  const [feed, setFeed] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const { toast, showToast } = useCornerToast();

  const loadPosts = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await postService.getPosts(targetPage, PAGE_SIZE);
      setFeed((previous) => (replace ? response.items : [...previous, ...response.items]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Unable to load posts.'));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(1, true);
  }, [loadPosts]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting) {
          return;
        }

        if (loadingRef.current) {
          return;
        }

        void loadPosts(page + 1);
      },
      {
        root: null,
        // Start loading slightly before the user reaches the absolute end.
        rootMargin: '320px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadPosts, page]);

  const handleCreatePost = async (draft: CreatePostDraft) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      let uploadedMediaUrl: string | undefined;

      if (draft.mediaFile) {
        uploadedMediaUrl = await cloudinaryService.uploadMedia(draft.mediaFile);
      }

      const created = await postService.createPost({
        content: draft.content,
        imageUrl: uploadedMediaUrl,
      });
      setFeed((previous) => [created, ...previous]);
      return true;
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Unable to create post.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setFeed((previous) => previous.filter((post) => post.id !== postId));
  };

  return (
    <div className="space-y-4">
      <CreatePostBox currentUser={currentUser} isSubmitting={isSubmitting} onCreatePost={handleCreatePost} />
      {createError ? <p className="text-sm text-rose-600 dark:text-rose-400">{createError}</p> : null}
      <StoryList currentUser={currentUser} onActionToast={showToast} />

      <section className={`${POST_COLUMN_CLASS} space-y-4`}>
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
            {isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
            ) : (
              <button
                type="button"
                onClick={() => void loadPosts(page + 1)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t('home.loadMore')}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.noMorePosts')}</p>
        )}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

