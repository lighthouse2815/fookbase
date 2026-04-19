import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import type { CreatePostDraft } from '@/interface/post';
import type { Post } from '@/interface/post';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { useCornerToast } from '@/hooks/useCornerToast';
import { cloudinaryService } from '@/services/cloudinaryService';
import { postService } from '@/services/postService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { UseHomePageReturn } from '../interface';
import {
  HOME_INFINITE_SCROLL_ROOT_MARGIN,
  HOME_PAGE_POST_PAGE_SIZE,
  HOME_POST_COLUMN_CLASS,
} from '../util';

export const useHomePage = (): UseHomePageReturn => {
  const { t } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();

  const [feed, setFeed] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSentinelVisible, setIsSentinelVisible] = useState(false);
  const loadingRef = useRef(false);
  const loadMoreSentinelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const { toast, showToast } = useCornerToast();

  const loadPosts = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await postService.getPosts(targetPage, HOME_PAGE_POST_PAGE_SIZE);
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
        setIsSentinelVisible(Boolean(firstEntry?.isIntersecting));
      },
      {
        root: null,
        rootMargin: HOME_INFINITE_SCROLL_ROOT_MARGIN,
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  useEffect(() => {
    if (!hasMore || !isSentinelVisible || isLoading) {
      return;
    }

    void loadPosts(page + 1);
  }, [hasMore, isSentinelVisible, isLoading, loadPosts, page]);

  const handleCreatePost = async (draft: CreatePostDraft) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      let uploadedVideoUrl: string | undefined;
      let uploadedImageUrls: string[] = [];

      if (draft.videoFile) {
        uploadedVideoUrl = await cloudinaryService.uploadMedia(draft.videoFile);
      }

      if (draft.imageFiles && draft.imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(draft.imageFiles.map((file) => cloudinaryService.uploadMedia(file)));
      }

      const mediaUrls = uploadedVideoUrl
        ? [uploadedVideoUrl]
        : uploadedImageUrls.length > 0
          ? uploadedImageUrls
          : undefined;

      const created = await postService.createPost({
        content: draft.content,
        imageUrls: mediaUrls,
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

  return {
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
    postColumnClass: HOME_POST_COLUMN_CLASS,
  };
};
