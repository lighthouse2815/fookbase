import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import { useCornerToast } from '@/hooks/useCornerToast';
import type { Post } from '@/interface/post';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { postService } from '@/services/postService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { UsePostDetailPageReturn } from '../interface';

export const usePostDetailPage = (): UsePostDetailPageReturn => {
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

  const handlePostDeleted = () => {
    setPost(null);
    setErrorMessage('Bai viet da duoc xoa.');
  };

  return {
    currentUser,
    post,
    isLoading,
    errorMessage,
    toast,
    showToast,
    handlePostDeleted,
  };
};
