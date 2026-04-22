import type { TFunction } from 'i18next';

import type { Post } from '@/features/post/types/contracts';
import type { MainLayoutOutletContext } from '@/shared/types/layout';

export type PostCornerToastType = 'success' | 'error';

export interface PostCornerToastSnapshot {
  message: string;
  type: PostCornerToastType;
}

export interface UsePostDetailPageReturn {
  currentUser: MainLayoutOutletContext['currentUser'];
  post: Post | null;
  isLoading: boolean;
  errorMessage: string | null;
  toast: PostCornerToastSnapshot | null;
  showToast: (message: string, type?: PostCornerToastType, durationMs?: number) => void;
  handlePostDeleted: () => void;
}

export interface UseSavedPostsPageReturn {
  t: TFunction;
  currentUser: MainLayoutOutletContext['currentUser'];
  savedPosts: Post[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  loadError: string | null;
  removingPostId: string | null;
  toast: PostCornerToastSnapshot | null;
  showToast: (message: string, type?: PostCornerToastType, durationMs?: number) => void;
  loadSavedPosts: (targetPage: number, replace?: boolean) => Promise<void>;
  handleRemoveSavedPost: (postId: string) => Promise<void>;
  handlePostDeleted: (postId: string) => void;
}


