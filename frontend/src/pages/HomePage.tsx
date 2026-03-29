import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import { CreatePostBox } from '../components/CreatePostBox';
import { PostCard } from '../components/PostCard';
import { StoryList } from '../components/StoryList';
import { stories } from '../data/mockData';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { postService } from '../services/postService';
import type { Post } from '../types/post';
import { getApiErrorMessage } from '../utils/apiError';

const PAGE_SIZE = 2;

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

  const handleCreatePost = async (content: string) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const created = await postService.createPost(content);
      setFeed((previous) => [created, ...previous]);
      return true;
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Unable to create post.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <CreatePostBox currentUser={currentUser} isSubmitting={isSubmitting} onCreatePost={handleCreatePost} />
      {createError ? <p className="text-sm text-rose-600 dark:text-rose-400">{createError}</p> : null}
      <StoryList stories={stories} />

      <section className="space-y-4">
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('home.feedTitle')}</h1>
        {loadError ? <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p> : null}
        {feed.map((post) => (
          <PostCard key={post.id} post={post} currentUser={currentUser} />
        ))}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadPosts(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? t('common.loading') : t('home.loadMore')}
          </button>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.noMorePosts')}</p>
        )}
      </div>
    </div>
  );
};

