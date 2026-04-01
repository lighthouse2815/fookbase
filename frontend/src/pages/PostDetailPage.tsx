import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import { CornerToast } from '../components/CornerToast';
import { PostCard } from '../components/PostCard';
import { useCornerToast } from '../hooks/useCornerToast';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { postService } from '../services/postService';
import type { Post } from '../types/post';
import { getApiErrorMessage } from '../utils/apiError';

export const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast, showToast } = useCornerToast();

  useEffect(() => {
    if (!postId) {
      setIsLoading(false);
      setErrorMessage('Post not found.');
      return;
    }

    let isCancelled = false;

    const loadPost = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const foundPost = await postService.getPostById(postId);

        if (isCancelled) {
          return;
        }

        setPost(foundPost);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setPost(null);
        setErrorMessage(getApiErrorMessage(error, 'Unable to load this post.'));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      isCancelled = true;
    };
  }, [postId]);

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

      <PostCard
        post={post}
        currentUser={currentUser}
        onActionToast={showToast}
        onPostDeleted={() => {
          setPost(null);
          setErrorMessage('Bai viet da duoc xoa.');
        }}
      />
      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};
