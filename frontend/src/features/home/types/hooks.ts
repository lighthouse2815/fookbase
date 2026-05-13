import type { TFunction } from 'i18next';
import type { RefObject } from 'react';

import type { CreatePostDraft, Post } from '@/features/post/types/contracts';
import type { MainLayoutOutletContext } from '@/shared/types/layout';

import type { HomeCornerToastType } from '@/features/home/types/common';

export interface HomeCornerToastSnapshot {
  message: string;
  type: HomeCornerToastType;
}

export interface UseHomePageReturn {
  t: TFunction;
  currentUser: MainLayoutOutletContext['currentUser'];
  feed: Post[];
  isLoading: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  createError: string | null;
  hasMore: boolean;
  loadMoreSentinelRef: RefObject<HTMLDivElement>;
  toast: HomeCornerToastSnapshot | null;
  showToast: (message: string, type?: HomeCornerToastType, durationMs?: number) => void;
  handleCreatePost: (draft: CreatePostDraft) => Promise<boolean>;
  handlePostDeleted: (postId: string) => void;
  handlePostUpdated: (updatedPost: Post) => void;
  postColumnClass: string;
}


