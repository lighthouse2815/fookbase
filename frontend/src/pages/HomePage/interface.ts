import type { TFunction } from 'i18next';
import type { RefObject } from 'react';

import type { CreatePostDraft } from '@/interface/post';
import type { Post } from '@/interface/post';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';

import type { HomeCornerToastType } from './type';

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
  postColumnClass: string;
}
