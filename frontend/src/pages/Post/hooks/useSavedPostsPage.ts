import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import type { Post } from '@/interface/post';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { useCornerToast } from '@/hooks/useCornerToast';
import { savedPostService } from '@/services/savedPostService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { UseSavedPostsPageReturn } from '../interface';
import { SAVED_POSTS_PAGE_SIZE } from '../util';

export const useSavedPostsPage = (): UseSavedPostsPageReturn => {
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
      const response = await savedPostService.getMine(targetPage, SAVED_POSTS_PAGE_SIZE);
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

  return {
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
  };
};
